import { Request, Response } from 'express';
import { queueService } from '../services/QueueService.ts';
import { CrackLevel, RepairSlot } from '../../shared/types.ts';

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

  async getSevenDaySandbox(req: Request, res: Response) {
    try {
      const sandbox = queueService.getSevenDaySandbox();
      res.json({ success: true, data: sandbox });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async getSlotPreview(req: Request, res: Response) {
    try {
      const { date, slot, faceStyle, crackLevel } = req.query;
      const targetDate = date as string;
      const targetSlot = slot as RepairSlot;
      const targetFaceStyle = faceStyle as string;
      const targetCrackLevel = crackLevel as CrackLevel;

      if (!targetDate || !targetSlot || !targetFaceStyle || !targetCrackLevel) {
        return res.status(400).json({
          success: false,
          error: '缺少必要参数'
        });
      }

      if (!['morning', 'afternoon'].includes(targetSlot)) {
        return res.status(400).json({
          success: false,
          error: '槽位参数无效'
        });
      }

      if (!['hairline', 'mesh', 'peeling'].includes(targetCrackLevel)) {
        return res.status(400).json({
          success: false,
          error: '龟裂等级参数无效'
        });
      }

      const preview = queueService.getSlotPreview(
        targetDate,
        targetSlot,
        targetFaceStyle,
        targetCrackLevel
      );
      res.json({ success: true, data: preview });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }
}

export const queueController = new QueueController();
