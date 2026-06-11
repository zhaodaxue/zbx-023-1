import { db } from '../db/index.ts';
import { TraceEvent, TraceEventType } from '../../shared/types.ts';

export class TraceEventRepository {
  private mapRow(row: any): TraceEvent {
    return {
      ...row,
      eventType: row.eventType as TraceEventType,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  findByRepairOrderId(repairOrderId: string): TraceEvent[] {
    const rows = db.prepare(`
      SELECT 
        id, repair_order_id as repairOrderId, event_type as eventType,
        event_desc as eventDesc, metadata, created_at as createdAt
      FROM trace_events
      WHERE repair_order_id = ?
      ORDER BY created_at ASC
    `).all(repairOrderId) as any[];
    return rows.map(r => this.mapRow(r));
  }

  create(
    repairOrderId: string,
    eventType: TraceEventType,
    eventDesc: string,
    metadata?: Record<string, any>
  ): TraceEvent {
    const id = `te_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    db.prepare(`
      INSERT INTO trace_events (id, repair_order_id, event_type, event_desc, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, repairOrderId, eventType, eventDesc, metadataStr);

    const row = db.prepare(`
      SELECT 
        id, repair_order_id as repairOrderId, event_type as eventType,
        event_desc as eventDesc, metadata, created_at as createdAt
      FROM trace_events
      WHERE id = ?
    `).get(id) as any;
    return this.mapRow(row);
  }
}

export const traceEventRepository = new TraceEventRepository();
