import { PaintBatch } from '../../shared/types.ts';
import { paintBatchRepository } from '../repositories/PaintBatchRepository.ts';
import { businessRulesEngine } from './BusinessRulesEngine.ts';

export class BatchService {
  getAllBatches(): PaintBatch[] {
    return paintBatchRepository.findAll();
  }

  getBatchByCode(batchCode: string): PaintBatch | undefined {
    return paintBatchRepository.findByBatchCode(batchCode);
  }

  searchBatches(keyword: string): PaintBatch[] {
    return paintBatchRepository.search(keyword);
  }

  getCompatibleBatches(batchCode: string): { valid: boolean; batch?: PaintBatch; compatibleBatches?: PaintBatch[]; error?: string } {
    const batch = paintBatchRepository.findByBatchCode(batchCode);
    if (!batch) {
      return { valid: false, error: `颜料批次「${batchCode}」不存在` };
    }

    const checkResult = businessRulesEngine.checkBatchCompatibility(batchCode);
    if (!checkResult.valid && checkResult.suggestedBatches) {
      return {
        valid: false,
        batch,
        compatibleBatches: checkResult.suggestedBatches,
        error: checkResult.error
      };
    }

    const compatibleBatches = paintBatchRepository.findCompatibleBatches(batch.id);
    return {
      valid: true,
      batch,
      compatibleBatches
    };
  }

  checkCompatibility(batchCode: string) {
    return businessRulesEngine.checkBatchCompatibility(batchCode);
  }
}

export const batchService = new BatchService();
