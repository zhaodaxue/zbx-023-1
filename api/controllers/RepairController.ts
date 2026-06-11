import { Request, Response } from 'express';
import { CreateRepairRequest, CompleteRepairRequest, RescheduleRequest } from '../../shared/types.ts';
import { repairService } from '../services/RepairService.ts';

export class RepairController {
  async createRepair(req: Request, res: Response) {
    try {
      const request: CreateRepairRequest = req.body;
      const result = repairService.createRepair(request);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async getRepair(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = repairService.getRepairById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: '报修单不存在'
        });
      }
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async getTraceEvents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = repairService.getRepairById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: '报修单不存在'
        });
      }
      const events = repairService.getTraceEvents(id);
      res.json({ success: true, data: { order, events } });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async completeRepair(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: CompleteRepairRequest = req.body;
      const result = repairService.completeRepair(id, request);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async rescheduleRepair(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request: RescheduleRequest = req.body;
      const result = repairService.rescheduleRepair(id, request);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async cancelRepair(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = repairService.cancelRepair(id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }
}

export const repairController = new RepairController();
