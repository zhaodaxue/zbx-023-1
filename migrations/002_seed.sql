INSERT OR IGNORE INTO puppet_heads (id, head_code, face_style) VALUES
  ('ph001', 'OH-2024-001', '生角'),
  ('ph002', 'OH-2024-002', '旦角'),
  ('ph003', 'OH-2024-003', '净角'),
  ('ph004', 'OH-2024-004', '末角'),
  ('ph005', 'OH-2024-005', '丑角'),
  ('ph006', 'OH-2024-006', '花脸');

INSERT OR IGNORE INTO paint_batches (id, batch_code, paint_type, manufacture_date) VALUES
  ('pb001', 'RED-2024-A01', '朱砂红', '2024-01-15'),
  ('pb002', 'RED-2024-A02', '朱砂红', '2024-02-20'),
  ('pb003', 'RED-2024-B01', '朱砂红', '2024-03-10'),
  ('pb004', 'BLK-2024-A01', '松烟墨', '2024-01-15'),
  ('pb005', 'BLK-2024-A02', '松烟墨', '2024-02-25'),
  ('pb006', 'WHT-2024-A01', '铅白粉', '2024-01-20');

INSERT OR IGNORE INTO batch_compatibility (id, batch_id, compatible_batch_id) VALUES
  ('bc001', 'pb001', 'pb002'),
  ('bc002', 'pb002', 'pb001'),
  ('bc003', 'pb002', 'pb003'),
  ('bc004', 'pb003', 'pb002'),
  ('bc005', 'pb004', 'pb005'),
  ('bc006', 'pb005', 'pb004');

INSERT OR IGNORE INTO repair_orders (id, order_no, puppet_head_id, head_code, face_style, crack_level, paint_batch_id, paint_batch_code, actual_paint_batch_id, actual_paint_batch_code, batch_change_note, slot, repair_date, status, priority, is_jumped, jump_reason, created_at, completed_at, reschedule_count) VALUES
  ('ro001', 'BX20240601001', 'ph001', 'OH-2024-001', '生角', 'hairline', 'pb001', 'RED-2024-A01', 'pb002', 'RED-2024-A02', '原批次库存不足，经配伍校验更换为同系列批次', 'morning', '2024-06-01', 'completed', 5, 0, NULL, '2024-06-01 08:30:00', '2024-06-01 10:15:00', 0),
  ('ro002', 'BX20240601002', 'ph003', 'OH-2024-003', '净角', 'peeling', 'pb004', 'BLK-2024-A01', 'pb005', 'BLK-2024-A02', '原批次颜料干结失效，更换为新生产批次', 'afternoon', '2024-06-01', 'completed', 1, 1, '龟裂等级为剥落，自动插队', '2024-06-01 09:15:00', '2024-06-01 15:30:00', 0);

INSERT OR IGNORE INTO trace_events (id, repair_order_id, event_type, event_desc, metadata, created_at) VALUES
  ('te001', 'ro001', 'created', '提交报修', '{"slot":"morning","crackLevel":"hairline"}', '2024-06-01 08:30:00'),
  ('te002', 'ro001', 'batch_changed', '更换颜料批次', '{"oldBatch":"RED-2024-A01","newBatch":"RED-2024-A02","note":"原批次库存不足，经配伍校验更换为同系列批次"}', '2024-06-01 09:45:00'),
  ('te003', 'ro001', 'completed', '修复完工', '{}', '2024-06-01 10:15:00'),
  ('te004', 'ro002', 'created', '提交报修', '{"slot":"afternoon","crackLevel":"peeling"}', '2024-06-01 09:15:00'),
  ('te005', 'ro002', 'jumped', '队列插队', '{"reason":"龟裂等级为剥落，自动插队","oldPriority":3,"newPriority":1}', '2024-06-01 09:15:01'),
  ('te006', 'ro002', 'batch_changed', '更换颜料批次', '{"oldBatch":"BLK-2024-A01","newBatch":"BLK-2024-A02","note":"原批次颜料干结失效，更换为新生产批次"}', '2024-06-01 14:20:00'),
  ('te007', 'ro002', 'completed', '修复完工', '{}', '2024-06-01 15:30:00');
