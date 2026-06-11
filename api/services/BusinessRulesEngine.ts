import { RepairOrder, CrackLevel, RepairSlot, PaintBatch } from '../../shared/types.ts';
import { repairOrderRepository } from '../repositories/RepairOrderRepository.ts';
import { paintBatchRepository } from '../repositories/PaintBatchRepository.ts';

export const SLOT_CAPACITY = 3;
export const MAX_JUMP_PER_STYLE_PER_DAY = 2;
export const RESCHEDULE_WINDOW_HOURS = 2;
export const JUMP_QUEUE_FRONT_PERCENT = 0.3;

export interface CompatibilityCheckResult {
  valid: boolean;
  error?: string;
  suggestedBatches?: PaintBatch[];
}

export interface PriorityCalculationResult {
  priority: number;
  isJumped: boolean;
  jumpReason?: string;
}

export class BusinessRulesEngine {
  checkBatchCompatibility(batchCode: string): CompatibilityCheckResult {
    const batch = paintBatchRepository.findByBatchCode(batchCode);
    if (!batch) {
      return {
        valid: false,
        error: `颜料批次「${batchCode}」不存在`
      };
    }

    const hasCompatibility = paintBatchRepository.hasCompatibility(batch.id);
    if (!hasCompatibility) {
      const sameTypeBatches = paintBatchRepository
        .findAll()
        .filter(b => b.paintType === batch.paintType && b.batchCode !== batchCode);
      
      return {
        valid: false,
        error: `颜料批次「${batchCode}」不在可补绘配伍表内，不可用于开脸修复`,
        suggestedBatches: sameTypeBatches
      };
    }

    return { valid: true };
  }

  checkSlotCapacity(date: string, slot: RepairSlot): boolean {
    const currentCount = repairOrderRepository.countByDateAndSlot(date, slot);
    return currentCount < SLOT_CAPACITY;
  }

  canJumpQueue(date: string, faceStyle: string, crackLevel: CrackLevel): boolean {
    if (crackLevel !== 'peeling') {
      return false;
    }

    const jumpedCount = repairOrderRepository.countJumpedByDateAndFaceStyle(date, faceStyle);
    return jumpedCount < MAX_JUMP_PER_STYLE_PER_DAY;
  }

  calculatePriority(
    date: string,
    slot: RepairSlot,
    faceStyle: string,
    crackLevel: CrackLevel,
    createdAt: string
  ): PriorityCalculationResult {
    const currentOrders = repairOrderRepository.findByDateAndSlot(date, slot);
    const totalCount = currentOrders.length;
    const basePriority = totalCount + 1;

    if (this.canJumpQueue(date, faceStyle, crackLevel)) {
      const jumpPosition = Math.max(1, Math.ceil(totalCount * JUMP_QUEUE_FRONT_PERCENT));
      return {
        priority: jumpPosition,
        isJumped: true,
        jumpReason: '龟裂等级为剥落，自动插队'
      };
    }

    return {
      priority: basePriority,
      isJumped: false
    };
  }

  recalculatePriorities(orders: RepairOrder[], newOrder: RepairOrder): { id: string; priority: number }[] {
    if (!newOrder.isJumped) {
      return orders.map(o => ({ id: o.id, priority: o.priority }));
    }

    const affected = orders
      .filter(o => o.priority >= newOrder.priority && o.id !== newOrder.id)
      .map(o => ({ id: o.id, priority: o.priority + 1 }));

    return affected;
  }

  canReschedule(createdAt: string, rescheduleCount: number): { allowed: boolean; reason?: string } {
    if (rescheduleCount >= 1) {
      return { allowed: false, reason: '已改期过一次，无法再次改期' };
    }

    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const hoursPassed = (now - created) / (1000 * 60 * 60);

    if (hoursPassed > RESCHEDULE_WINDOW_HOURS) {
      return { allowed: false, reason: `已超过${RESCHEDULE_WINDOW_HOURS}小时改期时限，只能撤销重提` };
    }

    return { allowed: true };
  }

  validateCompleteRequest(
    repairOrder: RepairOrder,
    actualBatchCode: string,
    batchChangeNote?: string
  ): { valid: boolean; error?: string } {
    if (repairOrder.status !== 'pending' && repairOrder.status !== 'processing' && repairOrder.status !== 'rescheduled') {
      return { valid: false, error: '只有待修复或修复中的工单可以完工登记' };
    }

    if (actualBatchCode !== repairOrder.paintBatchCode && (!batchChangeNote || batchChangeNote.trim().length === 0)) {
      return { valid: false, error: '实际批次与报修批次不同时，必须填写换批说明' };
    }

    return { valid: true };
  }
}

export const businessRulesEngine = new BusinessRulesEngine();
