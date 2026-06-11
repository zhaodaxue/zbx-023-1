import { db } from '../db/index.ts';
import {
  CreateRepairRequest,
  CreateRepairResponse,
  RepairOrder,
  CompleteRepairRequest,
  RescheduleRequest,
  RepairSlot
} from '../../shared/types.ts';
import { repairOrderRepository } from '../repositories/RepairOrderRepository.ts';
import { puppetHeadRepository } from '../repositories/PuppetHeadRepository.ts';
import { paintBatchRepository } from '../repositories/PaintBatchRepository.ts';
import { traceEventRepository } from '../repositories/TraceEventRepository.ts';
import { businessRulesEngine, SLOT_CAPACITY } from './BusinessRulesEngine.ts';

export class RepairService {
  createRepair(request: CreateRepairRequest): CreateRepairResponse {
    const tx = db.transaction(() => {
      const batch = paintBatchRepository.findByBatchCode(request.paintBatchCode);
      if (!batch) {
        return {
          success: false,
          error: {
            code: 'BATCH_NOT_FOUND',
            message: `颜料批次「${request.paintBatchCode}」不存在`
          }
        };
      }

      const compatibilityResult = businessRulesEngine.checkBatchCompatibility(request.paintBatchCode);
      if (!compatibilityResult.valid) {
        return {
          success: false,
          error: {
            code: 'INCOMPATIBLE_BATCH',
            message: compatibilityResult.error!,
            suggestedBatches: compatibilityResult.suggestedBatches
          }
        };
      }

      if (!businessRulesEngine.checkSlotCapacity(request.repairDate, request.slot)) {
        return {
          success: false,
          error: {
            code: 'SLOT_FULL',
            message: `「${request.repairDate}」${request.slot === 'morning' ? '上午' : '下午'}槽位已满（${SLOT_CAPACITY}件），请选择其他时间`
          }
        };
      }

      const puppetHead = puppetHeadRepository.findOrCreate(request.headCode, request.faceStyle);

      const orderNo = repairOrderRepository.generateOrderNo(request.repairDate);
      const now = new Date().toISOString();

      const priorityResult = businessRulesEngine.calculatePriority(
        request.repairDate,
        request.slot,
        request.faceStyle,
        request.crackLevel,
        now
      );

      const order = repairOrderRepository.create({
        orderNo,
        puppetHeadId: puppetHead.id,
        headCode: request.headCode,
        faceStyle: request.faceStyle,
        crackLevel: request.crackLevel,
        paintBatchId: batch.id,
        paintBatchCode: request.paintBatchCode,
        slot: request.slot,
        repairDate: request.repairDate,
        status: 'pending',
        priority: priorityResult.priority,
        isJumped: priorityResult.isJumped,
        jumpReason: priorityResult.jumpReason
      });

      const existingOrders = repairOrderRepository.findByDateAndSlot(request.repairDate, request.slot);
      const priorityUpdates = businessRulesEngine.recalculatePriorities(existingOrders, order);
      if (priorityUpdates.length > 0) {
        repairOrderRepository.updatePriorities(priorityUpdates);
      }

      traceEventRepository.create(order.id, 'created', '提交报修', {
        slot: request.slot,
        crackLevel: request.crackLevel
      });

      if (priorityResult.isJumped) {
        traceEventRepository.create(order.id, 'jumped', '队列插队', {
          reason: priorityResult.jumpReason,
          newPriority: priorityResult.priority
        });
      }

      return { success: true, data: order };
    });

    try {
      return tx();
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || '创建报修单失败'
        }
      };
    }
  }

  completeRepair(id: string, request: CompleteRepairRequest): { success: boolean; data?: RepairOrder; error?: string } {
    const tx = db.transaction(() => {
      const order = repairOrderRepository.findById(id);
      if (!order) {
        return { success: false, error: '报修单不存在' };
      }

      const validation = businessRulesEngine.validateCompleteRequest(
        order,
        request.actualPaintBatchCode,
        request.batchChangeNote
      );
      if (!validation.valid) {
        return { success: false, error: validation.error! };
      }

      const actualBatch = paintBatchRepository.findByBatchCode(request.actualPaintBatchCode);
      if (!actualBatch) {
        return { success: false, error: `实际颜料批次「${request.actualPaintBatchCode}」不存在` };
      }

      const updates: Partial<RepairOrder> = {
        status: 'completed',
        actualPaintBatchId: actualBatch.id,
        actualPaintBatchCode: request.actualPaintBatchCode,
        completedAt: new Date().toISOString()
      };

      if (request.actualPaintBatchCode !== order.paintBatchCode) {
        updates.batchChangeNote = request.batchChangeNote;
      }

      const updated = repairOrderRepository.update(id, updates)!;

      if (request.actualPaintBatchCode !== order.paintBatchCode) {
        traceEventRepository.create(id, 'batch_changed', '更换颜料批次', {
          oldBatch: order.paintBatchCode,
          newBatch: request.actualPaintBatchCode,
          note: request.batchChangeNote
        });
      }

      traceEventRepository.create(id, 'completed', '修复完工', {});

      return { success: true, data: updated };
    });

    try {
      return tx();
    } catch (error: any) {
      return { success: false, error: error.message || '完工登记失败' };
    }
  }

  rescheduleRepair(id: string, request: RescheduleRequest): { success: boolean; data?: RepairOrder; error?: string } {
    const tx = db.transaction(() => {
      const order = repairOrderRepository.findById(id);
      if (!order) {
        return { success: false, error: '报修单不存在' };
      }

      const canReschedule = businessRulesEngine.canReschedule(order.createdAt, order.rescheduleCount);
      if (!canReschedule.allowed) {
        return { success: false, error: canReschedule.reason! };
      }

      if (!businessRulesEngine.checkSlotCapacity(request.newDate, request.newSlot)) {
        return {
          success: false,
          error: `「${request.newDate}」${request.newSlot === 'morning' ? '上午' : '下午'}槽位已满（${SLOT_CAPACITY}件），请选择其他时间`
        };
      }

      const priorityResult = businessRulesEngine.calculatePriority(
        request.newDate,
        request.newSlot,
        order.faceStyle,
        order.crackLevel,
        order.createdAt
      );

      const updated = repairOrderRepository.update(id, {
        slot: request.newSlot,
        repairDate: request.newDate,
        priority: priorityResult.priority,
        isJumped: priorityResult.isJumped,
        jumpReason: priorityResult.jumpReason,
        rescheduledAt: new Date().toISOString(),
        rescheduleCount: order.rescheduleCount + 1
      })!;

      const existingOrders = repairOrderRepository.findByDateAndSlot(request.newDate, request.newSlot);
      const priorityUpdates = businessRulesEngine.recalculatePriorities(existingOrders, updated);
      if (priorityUpdates.length > 0) {
        repairOrderRepository.updatePriorities(priorityUpdates);
      }

      traceEventRepository.create(id, 'rescheduled', '改期', {
        oldSlot: order.slot,
        oldDate: order.repairDate,
        newSlot: request.newSlot,
        newDate: request.newDate
      });

      if (priorityResult.isJumped) {
        traceEventRepository.create(id, 'jumped', '队列插队', {
          reason: priorityResult.jumpReason,
          newPriority: priorityResult.priority
        });
      }

      return { success: true, data: updated };
    });

    try {
      return tx();
    } catch (error: any) {
      return { success: false, error: error.message || '改期失败' };
    }
  }

  cancelRepair(id: string): { success: boolean; data?: RepairOrder; error?: string } {
    const tx = db.transaction(() => {
      const order = repairOrderRepository.findById(id);
      if (!order) {
        return { success: false, error: '报修单不存在' };
      }

      if (order.status === 'completed') {
        return { success: false, error: '已完工的工单无法撤销' };
      }

      const updated = repairOrderRepository.update(id, {
        status: 'cancelled'
      })!;

      traceEventRepository.create(id, 'cancelled', '撤销报修', {});

      const remainingOrders = repairOrderRepository.findByDateAndSlot(order.repairDate, order.slot);
      const updates = remainingOrders
        .filter(o => o.priority > order.priority)
        .map(o => ({ id: o.id, priority: o.priority - 1 }));
      if (updates.length > 0) {
        repairOrderRepository.updatePriorities(updates);
      }

      return { success: true, data: updated };
    });

    try {
      return tx();
    } catch (error: any) {
      return { success: false, error: error.message || '撤销失败' };
    }
  }

  getRepairById(id: string): RepairOrder | undefined {
    return repairOrderRepository.findById(id);
  }

  getTraceEvents(orderId: string) {
    return traceEventRepository.findByRepairOrderId(orderId);
  }
}

export const repairService = new RepairService();
