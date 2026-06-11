import { DailyQueue, RepairSlot, QueueSlotInfo, SandboxDay, SandboxSlot, FaceStyleJumpQuota, SlotPreviewResult, CrackLevel } from '../../shared/types.ts';
import { repairOrderRepository } from '../repositories/RepairOrderRepository.ts';
import { SLOT_CAPACITY, MAX_JUMP_PER_STYLE_PER_DAY, businessRulesEngine } from './BusinessRulesEngine.ts';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const FACE_STYLES = ['生角', '旦角', '净角', '末角', '丑角', '花脸'];

export class QueueService {
  getDailyQueue(date: string): DailyQueue {
    const allOrders = repairOrderRepository.findAllByDate(date);

    const morningOrders = allOrders
      .filter(o => o.slot === 'morning')
      .sort((a, b) => a.priority - b.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const afternoonOrders = allOrders
      .filter(o => o.slot === 'afternoon')
      .sort((a, b) => a.priority - b.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const morningCount = morningOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const afternoonCount = afternoonOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;

    const morningSlotInfo: QueueSlotInfo = {
      slot: 'morning',
      total: morningCount,
      capacity: SLOT_CAPACITY,
      remaining: Math.max(0, SLOT_CAPACITY - morningCount)
    };

    const afternoonSlotInfo: QueueSlotInfo = {
      slot: 'afternoon',
      total: afternoonCount,
      capacity: SLOT_CAPACITY,
      remaining: Math.max(0, SLOT_CAPACITY - afternoonCount)
    };

    return {
      date,
      morning: {
        orders: morningOrders,
        slotInfo: morningSlotInfo
      },
      afternoon: {
        orders: afternoonOrders,
        slotInfo: afternoonSlotInfo
      }
    };
  }

  getSlotCapacity(date: string, slot: RepairSlot): QueueSlotInfo {
    const queue = this.getDailyQueue(date);
    return slot === 'morning' ? queue.morning.slotInfo : queue.afternoon.slotInfo;
  }

  getSevenDaySandbox(): SandboxDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toISOString().split('T')[0];

    const jumpedCounts = repairOrderRepository.countJumpedGroupedByDateAndFace(todayStr, endDateStr);

    const jumpMap = new Map<string, Map<string, number>>();
    for (const item of jumpedCounts) {
      if (!jumpMap.has(item.date)) {
        jumpMap.set(item.date, new Map());
      }
      jumpMap.get(item.date)!.set(item.faceStyle, item.count);
    }

    const days: SandboxDay[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;
      const weekday = WEEKDAYS[d.getDay()];

      const dayJumpMap = jumpMap.get(dateStr) || new Map();

      const buildSlot = (slot: RepairSlot): SandboxSlot => {
        const queue = this.getDailyQueue(dateStr);
        const slotInfo = slot === 'morning' ? queue.morning.slotInfo : queue.afternoon.slotInfo;

        const jumpQuotas: FaceStyleJumpQuota[] = FACE_STYLES.map(faceStyle => {
          const used = dayJumpMap.get(faceStyle) || 0;
          return {
            faceStyle,
            used,
            quota: MAX_JUMP_PER_STYLE_PER_DAY,
            remaining: Math.max(0, MAX_JUMP_PER_STYLE_PER_DAY - used)
          };
        });

        return {
          slot,
          total: slotInfo.total,
          capacity: slotInfo.capacity,
          remaining: slotInfo.remaining,
          isFull: slotInfo.remaining <= 0,
          jumpQuotas
        };
      };

      days.push({
        date: dateStr,
        weekday,
        isToday,
        morning: buildSlot('morning'),
        afternoon: buildSlot('afternoon')
      });
    }

    return days;
  }

  getSlotPreview(
    date: string,
    slot: RepairSlot,
    faceStyle: string,
    crackLevel: CrackLevel
  ): SlotPreviewResult {
    const queue = this.getDailyQueue(date);
    const slotData = slot === 'morning' ? queue.morning : queue.afternoon;
    const slotInfo = slotData.slotInfo;
    const isSlotFull = slotInfo.remaining <= 0;

    const canJump = businessRulesEngine.canJumpQueue(date, faceStyle, crackLevel);
    const willJump = canJump && crackLevel === 'peeling';

    const jumpedCount = repairOrderRepository.countJumpedByDateAndFaceStyle(date, faceStyle);
    const jumpQuotaRemaining = Math.max(0, MAX_JUMP_PER_STYLE_PER_DAY - jumpedCount);

    let estimatedPosition: number;
    let canSubmit = true;
    let rejectReason: string | undefined;

    if (isSlotFull) {
      canSubmit = false;
      rejectReason = '该槽位已满，请选择其他时间';
      estimatedPosition = slotInfo.total + 1;
    } else if (crackLevel === 'peeling' && !canJump) {
      canSubmit = false;
      rejectReason = `「${faceStyle}」当日插队额度已用尽（${MAX_JUMP_PER_STYLE_PER_DAY}件/天），请选择其他日期或降低龟裂等级`;
      estimatedPosition = slotInfo.total + 1;
    } else if (willJump) {
      estimatedPosition = Math.max(1, Math.ceil(slotInfo.total * 0.3));
    } else {
      estimatedPosition = slotInfo.total + 1;
    }

    return {
      slot,
      date,
      estimatedPosition,
      totalOrders: slotInfo.total,
      capacity: slotInfo.capacity,
      isSlotFull,
      willJump,
      canJump,
      jumpQuotaUsed: jumpedCount,
      jumpQuotaTotal: MAX_JUMP_PER_STYLE_PER_DAY,
      jumpQuotaRemaining,
      canSubmit,
      rejectReason
    };
  }
}

export const queueService = new QueueService();
