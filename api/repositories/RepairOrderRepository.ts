import { db } from '../db/index.ts';
import { RepairOrder, CrackLevel, RepairSlot, RepairStatus } from '../../shared/types.ts';

export class RepairOrderRepository {
  private mapRow(row: any): RepairOrder {
    return {
      ...row,
      isJumped: row.isJumped === 1,
      crackLevel: row.crackLevel as CrackLevel,
      slot: row.slot as RepairSlot,
      status: row.status as RepairStatus
    };
  }

  findById(id: string): RepairOrder | undefined {
    const row = db.prepare(`
      SELECT 
        id, order_no as orderNo, puppet_head_id as puppetHeadId,
        head_code as headCode, face_style as faceStyle, crack_level as crackLevel,
        paint_batch_id as paintBatchId, paint_batch_code as paintBatchCode,
        actual_paint_batch_id as actualPaintBatchId, actual_paint_batch_code as actualPaintBatchCode,
        batch_change_note as batchChangeNote, slot, repair_date as repairDate,
        status, priority, is_jumped as isJumped, jump_reason as jumpReason,
        created_at as createdAt, completed_at as completedAt,
        rescheduled_at as rescheduledAt, reschedule_count as rescheduleCount
      FROM repair_orders
      WHERE id = ?
    `).get(id) as any;
    return row ? this.mapRow(row) : undefined;
  }

  findByOrderNo(orderNo: string): RepairOrder | undefined {
    const row = db.prepare(`
      SELECT 
        id, order_no as orderNo, puppet_head_id as puppetHeadId,
        head_code as headCode, face_style as faceStyle, crack_level as crackLevel,
        paint_batch_id as paintBatchId, paint_batch_code as paintBatchCode,
        actual_paint_batch_id as actualPaintBatchId, actual_paint_batch_code as actualPaintBatchCode,
        batch_change_note as batchChangeNote, slot, repair_date as repairDate,
        status, priority, is_jumped as isJumped, jump_reason as jumpReason,
        created_at as createdAt, completed_at as completedAt,
        rescheduled_at as rescheduledAt, reschedule_count as rescheduleCount
      FROM repair_orders
      WHERE order_no = ?
    `).get(orderNo) as any;
    return row ? this.mapRow(row) : undefined;
  }

  findByDateAndSlot(date: string, slot: RepairSlot): RepairOrder[] {
    const rows = db.prepare(`
      SELECT 
        id, order_no as orderNo, puppet_head_id as puppetHeadId,
        head_code as headCode, face_style as faceStyle, crack_level as crackLevel,
        paint_batch_id as paintBatchId, paint_batch_code as paintBatchCode,
        actual_paint_batch_id as actualPaintBatchId, actual_paint_batch_code as actualPaintBatchCode,
        batch_change_note as batchChangeNote, slot, repair_date as repairDate,
        status, priority, is_jumped as isJumped, jump_reason as jumpReason,
        created_at as createdAt, completed_at as completedAt,
        rescheduled_at as rescheduledAt, reschedule_count as rescheduleCount
      FROM repair_orders
      WHERE repair_date = ? AND slot = ? AND status IN ('pending', 'processing')
      ORDER BY priority ASC, created_at ASC
    `).all(date, slot) as any[];
    return rows.map(r => this.mapRow(r));
  }

  countByDateAndSlot(date: string, slot: RepairSlot): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM repair_orders
      WHERE repair_date = ? AND slot = ? AND status IN ('pending', 'processing')
    `).get(date, slot) as any;
    return row.count;
  }

  countJumpedByDateAndFaceStyle(date: string, faceStyle: string): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count
      FROM repair_orders
      WHERE repair_date = ? AND face_style = ? AND is_jumped = 1 AND status != 'cancelled'
    `).get(date, faceStyle) as any;
    return row.count;
  }

  findAllByDate(date: string): RepairOrder[] {
    const rows = db.prepare(`
      SELECT 
        id, order_no as orderNo, puppet_head_id as puppetHeadId,
        head_code as headCode, face_style as faceStyle, crack_level as crackLevel,
        paint_batch_id as paintBatchId, paint_batch_code as paintBatchCode,
        actual_paint_batch_id as actualPaintBatchId, actual_paint_batch_code as actualPaintBatchCode,
        batch_change_note as batchChangeNote, slot, repair_date as repairDate,
        status, priority, is_jumped as isJumped, jump_reason as jumpReason,
        created_at as createdAt, completed_at as completedAt,
        rescheduled_at as rescheduledAt, reschedule_count as rescheduleCount
      FROM repair_orders
      WHERE repair_date = ?
      ORDER BY slot, priority ASC, created_at ASC
    `).all(date) as any[];
    return rows.map(r => this.mapRow(r));
  }

  create(data: Omit<RepairOrder, 'id' | 'createdAt' | 'rescheduleCount'>): RepairOrder {
    const id = `ro_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO repair_orders (
        id, order_no, puppet_head_id, head_code, face_style, crack_level,
        paint_batch_id, paint_batch_code, actual_paint_batch_id, actual_paint_batch_code,
        batch_change_note, slot, repair_date, status, priority, is_jumped,
        jump_reason, completed_at, rescheduled_at, reschedule_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      id, data.orderNo, data.puppetHeadId, data.headCode, data.faceStyle,
      data.crackLevel, data.paintBatchId, data.paintBatchCode,
      data.actualPaintBatchId || null, data.actualPaintBatchCode || null,
      data.batchChangeNote || null, data.slot, data.repairDate,
      data.status, data.priority, data.isJumped ? 1 : 0,
      data.jumpReason || null, data.completedAt || null, data.rescheduledAt || null
    );
    return this.findById(id)!;
  }

  update(id: string, data: Partial<RepairOrder>): RepairOrder | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      status: 'status',
      actualPaintBatchId: 'actual_paint_batch_id',
      actualPaintBatchCode: 'actual_paint_batch_code',
      batchChangeNote: 'batch_change_note',
      slot: 'slot',
      repairDate: 'repair_date',
      priority: 'priority',
      isJumped: 'is_jumped',
      jumpReason: 'jump_reason',
      completedAt: 'completed_at',
      rescheduledAt: 'rescheduled_at',
      rescheduleCount: 'reschedule_count'
    };

    for (const [key, value] of Object.entries(data)) {
      const dbField = fieldMap[key];
      if (dbField) {
        fields.push(`${dbField} = ?`);
        values.push(key === 'isJumped' ? (value ? 1 : 0) : value);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE repair_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id);
  }

  updatePriorities(orders: { id: string; priority: number }[]): void {
    const stmt = db.prepare('UPDATE repair_orders SET priority = ? WHERE id = ?');
    const tx = db.transaction((items: { id: string; priority: number }[]) => {
      for (const item of items) {
        stmt.run(item.priority, item.id);
      }
    });
    tx(orders);
  }

  generateOrderNo(date: string): string {
    const dateStr = date.replace(/-/g, '');
    const row = db.prepare(`
      SELECT COALESCE(MAX(CAST(SUBSTR(order_no, 11) AS INTEGER)), 0) as maxNum
      FROM repair_orders
      WHERE SUBSTR(order_no, 3, 8) = ?
    `).get(dateStr) as any;
    const seq = (row.maxNum + 1).toString().padStart(3, '0');
    return `BX${dateStr}${seq}`;
  }
}

export const repairOrderRepository = new RepairOrderRepository();
