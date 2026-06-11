CREATE TABLE IF NOT EXISTS puppet_heads (
  id TEXT PRIMARY KEY,
  head_code TEXT UNIQUE NOT NULL,
  face_style TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS paint_batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT UNIQUE NOT NULL,
  paint_type TEXT NOT NULL,
  manufacture_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batch_compatibility (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  compatible_batch_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (batch_id) REFERENCES paint_batches(id),
  FOREIGN KEY (compatible_batch_id) REFERENCES paint_batches(id),
  UNIQUE(batch_id, compatible_batch_id)
);

CREATE TABLE IF NOT EXISTS repair_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  puppet_head_id TEXT NOT NULL,
  head_code TEXT NOT NULL,
  face_style TEXT NOT NULL,
  crack_level TEXT NOT NULL CHECK (crack_level IN ('hairline', 'mesh', 'peeling')),
  paint_batch_id TEXT NOT NULL,
  paint_batch_code TEXT NOT NULL,
  actual_paint_batch_id TEXT,
  actual_paint_batch_code TEXT,
  batch_change_note TEXT,
  slot TEXT NOT NULL CHECK (slot IN ('morning', 'afternoon')),
  repair_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'rescheduled')),
  priority INTEGER NOT NULL DEFAULT 0,
  is_jumped INTEGER NOT NULL DEFAULT 0,
  jump_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  rescheduled_at TEXT,
  reschedule_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (puppet_head_id) REFERENCES puppet_heads(id),
  FOREIGN KEY (paint_batch_id) REFERENCES paint_batches(id),
  FOREIGN KEY (actual_paint_batch_id) REFERENCES paint_batches(id)
);

CREATE TABLE IF NOT EXISTS trace_events (
  id TEXT PRIMARY KEY,
  repair_order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_desc TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (repair_order_id) REFERENCES repair_orders(id)
);

CREATE INDEX IF NOT EXISTS idx_repair_orders_date_slot ON repair_orders(repair_date, slot);
CREATE INDEX IF NOT EXISTS idx_repair_orders_status ON repair_orders(status);
CREATE INDEX IF NOT EXISTS idx_trace_events_order ON trace_events(repair_order_id);
