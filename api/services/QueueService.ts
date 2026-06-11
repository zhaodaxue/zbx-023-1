import { DailyQueue, RepairSlot, QueueSlotInfo } from '../../shared/types.ts';
import { repairOrderRepository } from '../repositories/RepairOrderRepository.ts';
import { SLOT_CAPACITY } from './BusinessRulesEngine.ts';

export class QueueService {
  getDailyQueue(date: string): DailyQueue {
    const allOrders = repairOrderRepository.findAllByDate(date);

    const morningOrders = allOrders
      .filter(o => o.slot === 'morning')
      .sort((a, b) => a.priority - b.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const afternoonOrders = allOrders
      .filter(o => o.slot === 'afternoon')
      .sort((a, b) => a.priority - b.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const morningCount = morningOrders.filter(o => o.status !== 'cancelled').length;
    const afternoonCount = afternoonOrders.filter(o => o.status !== 'cancelled').length;

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
}

export const queueService = new QueueService();
