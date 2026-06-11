export type CrackLevel = 'hairline' | 'mesh' | 'peeling';

export type RepairSlot = 'morning' | 'afternoon';

export type RepairStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'rescheduled';

export type TraceEventType = 'created' | 'jumped' | 'rescheduled' | 'cancelled' | 'completed' | 'batch_changed';

export interface PuppetHead {
  id: string;
  headCode: string;
  faceStyle: string;
  createdAt: string;
}

export interface PaintBatch {
  id: string;
  batchCode: string;
  paintType: string;
  manufactureDate: string;
  compatibleBatches: string[];
}

export interface RepairOrder {
  id: string;
  orderNo: string;
  puppetHeadId: string;
  headCode: string;
  faceStyle: string;
  crackLevel: CrackLevel;
  paintBatchId: string;
  paintBatchCode: string;
  actualPaintBatchId?: string;
  actualPaintBatchCode?: string;
  batchChangeNote?: string;
  slot: RepairSlot;
  repairDate: string;
  status: RepairStatus;
  priority: number;
  isJumped: boolean;
  jumpReason?: string;
  createdAt: string;
  completedAt?: string;
  rescheduledAt?: string;
  rescheduleCount: number;
}

export interface TraceEvent {
  id: string;
  repairOrderId: string;
  eventType: TraceEventType;
  eventDesc: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface CreateRepairRequest {
  headCode: string;
  faceStyle: string;
  crackLevel: CrackLevel;
  paintBatchCode: string;
  slot: RepairSlot;
  repairDate: string;
}

export interface CreateRepairResponse {
  success: boolean;
  data?: RepairOrder;
  error?: {
    code: string;
    message: string;
    suggestedBatches?: PaintBatch[];
  };
}

export interface CompleteRepairRequest {
  actualPaintBatchCode: string;
  batchChangeNote?: string;
}

export interface RescheduleRequest {
  newSlot: RepairSlot;
  newDate: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface QueueSlotInfo {
  slot: RepairSlot;
  total: number;
  capacity: number;
  remaining: number;
}

export interface DailyQueue {
  date: string;
  morning: {
    orders: RepairOrder[];
    slotInfo: QueueSlotInfo;
  };
  afternoon: {
    orders: RepairOrder[];
    slotInfo: QueueSlotInfo;
  };
}

export interface FaceStyleJumpQuota {
  faceStyle: string;
  used: number;
  quota: number;
  remaining: number;
}

export interface SandboxSlot {
  slot: RepairSlot;
  total: number;
  capacity: number;
  remaining: number;
  isFull: boolean;
  jumpQuotas: FaceStyleJumpQuota[];
}

export interface SandboxDay {
  date: string;
  weekday: string;
  isToday: boolean;
  morning: SandboxSlot;
  afternoon: SandboxSlot;
}

export interface SlotPreviewResult {
  slot: RepairSlot;
  date: string;
  estimatedPosition: number;
  totalOrders: number;
  capacity: number;
  isSlotFull: boolean;
  willJump: boolean;
  canJump: boolean;
  jumpQuotaUsed: number;
  jumpQuotaTotal: number;
  jumpQuotaRemaining: number;
  canSubmit: boolean;
  rejectReason?: string;
}

export const CRACK_LEVEL_LABELS: Record<CrackLevel, string> = {
  hairline: '发丝纹',
  mesh: '网状纹',
  peeling: '剥落'
};

export const SLOT_LABELS: Record<RepairSlot, string> = {
  morning: '上午',
  afternoon: '下午'
};

export const STATUS_LABELS: Record<RepairStatus, string> = {
  pending: '待修复',
  processing: '修复中',
  completed: '已完工',
  cancelled: '已撤销',
  rescheduled: '已改期'
};
