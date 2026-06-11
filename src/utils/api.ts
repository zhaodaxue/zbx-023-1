import {
  CreateRepairRequest,
  CreateRepairResponse,
  CompleteRepairRequest,
  RescheduleRequest,
  RepairOrder,
  PaintBatch,
  DailyQueue,
  QueueSlotInfo,
  TraceEvent,
} from '@shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  return response.json();
}

export const api = {
  repairs: {
    create: (data: CreateRepairRequest): Promise<CreateRepairResponse> =>
      request('/repairs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    get: (id: string): Promise<{ success: boolean; data?: RepairOrder; error?: string }> =>
      request(`/repairs/${id}`),

    getTrace: (id: string): Promise<{ success: boolean; data?: { order: RepairOrder; events: TraceEvent[] }; error?: string }> =>
      request(`/repairs/${id}/trace`),

    complete: (id: string, data: CompleteRepairRequest): Promise<{ success: boolean; data?: RepairOrder; error?: string }> =>
      request(`/repairs/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    reschedule: (id: string, data: RescheduleRequest): Promise<{ success: boolean; data?: RepairOrder; error?: string }> =>
      request(`/repairs/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    cancel: (id: string): Promise<{ success: boolean; data?: RepairOrder; error?: string }> =>
      request(`/repairs/${id}/cancel`, {
        method: 'POST',
      }),
  },

  queue: {
    getDaily: (date?: string): Promise<{ success: boolean; data?: DailyQueue; error?: string }> =>
      request(`/queue${date ? `?date=${date}` : ''}`),

    getCapacity: (date: string, slot: 'morning' | 'afternoon'): Promise<{ success: boolean; data?: QueueSlotInfo; error?: string }> =>
      request(`/queue/capacity?date=${date}&slot=${slot}`),
  },

  batches: {
    getAll: (keyword?: string): Promise<{ success: boolean; data?: PaintBatch[]; error?: string }> =>
      request(`/batches${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),

    get: (batchCode: string): Promise<{ success: boolean; data?: PaintBatch; error?: string }> =>
      request(`/batches/${batchCode}`),

    getCompatible: (batchCode: string): Promise<{
      success: boolean;
      valid: boolean;
      batch?: PaintBatch;
      compatibleBatches?: PaintBatch[];
      error?: string;
    }> =>
      request(`/batches/${batchCode}/compatible`),

    checkCompatibility: (batchCode: string): Promise<{
      success: boolean;
      valid: boolean;
      error?: string;
      suggestedBatches?: PaintBatch[];
    }> =>
      request(`/batches/${batchCode}/check`),
  },
};
