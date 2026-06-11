import { Request, Response } from 'express';
import { batchService } from '../services/BatchService.ts';

export class BatchController {
  async getAllBatches(req: Request, res: Response) {
    try {
      const { keyword } = req.query;
      let batches;
      if (keyword) {
        batches = batchService.searchBatches(keyword as string);
      } else {
        batches = batchService.getAllBatches();
      }
      res.json({ success: true, data: batches });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async getBatch(req: Request, res: Response) {
    try {
      const { batchCode } = req.params;
      const batch = batchService.getBatchByCode(batchCode);
      if (!batch) {
        return res.status(404).json({
          success: false,
          error: '批次不存在'
        });
      }
      res.json({ success: true, data: batch });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async getCompatibleBatches(req: Request, res: Response) {
    try {
      const { batchCode } = req.params;
      const result = batchService.getCompatibleBatches(batchCode);
      res.json({ success: result.valid, ...result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }

  async checkCompatibility(req: Request, res: Response) {
    try {
      const { batchCode } = req.params;
      const result = batchService.checkCompatibility(batchCode);
      res.json({ success: result.valid, ...result });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || '服务器内部错误'
      });
    }
  }
}

export const batchController = new BatchController();
