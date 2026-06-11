import { Request, Response } from 'express';
import { queueService } from '../services/QueueService.ts';

export class QueueController {
  async getDailyQueue(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const targetDate = (date as string) || new Date().toISOString().split('T')[0];
      const queue = queueService.getDailyQueue(targetDate);
      res.json({ success: true, data: queue });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async getSlotCapacity(req: Request, res: Response) {
    try {
      const { date, slot } = req.query;
      const targetDate = (date as string) || new Date().toISOString().split('T')[0];
      const targetSlot = slot as 'morning' | 'afternoon';
      if (!targetSlot || !['morning', 'afternoon'].includes(targetSlot)) {
        return res.status(400).json({
          success: false,
          error: '槽位参数无效'
        });
      }
      const capacity = queueService.getSlotCapacity(targetDate, targetSlot);
      res.json({ success: true, data: capacity });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }
}

export const queueController = new QueueController();
