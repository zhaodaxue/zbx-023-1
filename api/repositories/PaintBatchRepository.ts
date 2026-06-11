import { db } from '../db/index.ts';
import { PaintBatch } from '../../shared/types.ts';

export class PaintBatchRepository {
  private mapRow(row: any): PaintBatch {
    return {
      ...row,
      compatibleBatches: row.compatibleBatches ? JSON.parse(row.compatibleBatches) : []
    };
  }

  findAll(): PaintBatch[] {
    const rows = db.prepare(`
      SELECT 
        pb.id, 
        pb.batch_code as batchCode, 
        pb.paint_type as paintType, 
        pb.manufacture_date as manufactureDate,
        COALESCE(
          (SELECT json_group_array(bc2.compatible_batch_id)
           FROM batch_compatibility bc2
           WHERE bc2.batch_id = pb.id),
          '[]'
        ) as compatibleBatches
      FROM paint_batches pb
      ORDER BY pb.batch_code
    `).all() as any[];
    return rows.map(r => this.mapRow(r));
  }

  findByBatchCode(batchCode: string): PaintBatch | undefined {
    const row = db.prepare(`
      SELECT 
        pb.id, 
        pb.batch_code as batchCode, 
        pb.paint_type as paintType, 
        pb.manufacture_date as manufactureDate,
        COALESCE(
          (SELECT json_group_array(bc2.compatible_batch_id)
           FROM batch_compatibility bc2
           WHERE bc2.batch_id = pb.id),
          '[]'
        ) as compatibleBatches
      FROM paint_batches pb
      WHERE pb.batch_code = ?
    `).get(batchCode) as any;
    return row ? this.mapRow(row) : undefined;
  }

  findById(id: string): PaintBatch | undefined {
    const row = db.prepare(`
      SELECT 
        pb.id, 
        pb.batch_code as batchCode, 
        pb.paint_type as paintType, 
        pb.manufacture_date as manufactureDate,
        COALESCE(
          (SELECT json_group_array(bc2.compatible_batch_id)
           FROM batch_compatibility bc2
           WHERE bc2.batch_id = pb.id),
          '[]'
        ) as compatibleBatches
      FROM paint_batches pb
      WHERE pb.id = ?
    `).get(id) as any;
    return row ? this.mapRow(row) : undefined;
  }

  findCompatibleBatches(batchId: string): PaintBatch[] {
    const rows = db.prepare(`
      SELECT 
        pb.id, 
        pb.batch_code as batchCode, 
        pb.paint_type as paintType, 
        pb.manufacture_date as manufactureDate,
        '[]' as compatibleBatches
      FROM paint_batches pb
      INNER JOIN batch_compatibility bc ON bc.compatible_batch_id = pb.id
      WHERE bc.batch_id = ?
      ORDER BY pb.batch_code
    `).all(batchId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  search(keyword: string): PaintBatch[] {
    const searchTerm = `%${keyword}%`;
    const rows = db.prepare(`
      SELECT 
        pb.id, 
        pb.batch_code as batchCode, 
        pb.paint_type as paintType, 
        pb.manufacture_date as manufactureDate,
        COALESCE(
          (SELECT json_group_array(bc2.compatible_batch_id)
           FROM batch_compatibility bc2
           WHERE bc2.batch_id = pb.id),
          '[]'
        ) as compatibleBatches
      FROM paint_batches pb
      WHERE pb.batch_code LIKE ? OR pb.paint_type LIKE ?
      ORDER BY pb.batch_code
    `).all(searchTerm, searchTerm) as any[];
    return rows.map(r => this.mapRow(r));
  }

  hasCompatibility(batchId: string): boolean {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM batch_compatibility
      WHERE batch_id = ?
    `).get(batchId) as any;
    return row.count > 0;
  }
}

export const paintBatchRepository = new PaintBatchRepository();
