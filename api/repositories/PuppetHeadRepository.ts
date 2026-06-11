import { db } from '../db/index.ts';
import { PuppetHead } from '../../shared/types.ts';

export class PuppetHeadRepository {
  findAll(): PuppetHead[] {
    const rows = db.prepare(`
      SELECT id, head_code as headCode, face_style as faceStyle, created_at as createdAt
      FROM puppet_heads
      ORDER BY head_code
    `).all() as any[];
    return rows;
  }

  findByHeadCode(headCode: string): PuppetHead | undefined {
    const row = db.prepare(`
      SELECT id, head_code as headCode, face_style as faceStyle, created_at as createdAt
      FROM puppet_heads
      WHERE head_code = ?
    `).get(headCode) as any;
    return row;
  }

  findById(id: string): PuppetHead | undefined {
    const row = db.prepare(`
      SELECT id, head_code as headCode, face_style as faceStyle, created_at as createdAt
      FROM puppet_heads
      WHERE id = ?
    `).get(id) as any;
    return row;
  }

  create(headCode: string, faceStyle: string): PuppetHead {
    const id = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO puppet_heads (id, head_code, face_style)
      VALUES (?, ?, ?)
    `).run(id, headCode, faceStyle);
    return this.findById(id)!;
  }

  findOrCreate(headCode: string, faceStyle: string): PuppetHead {
    let head = this.findByHeadCode(headCode);
    if (!head) {
      head = this.create(headCode, faceStyle);
    }
    return head;
  }
}

export const puppetHeadRepository = new PuppetHeadRepository();
