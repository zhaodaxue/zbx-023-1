import { create } from 'zustand';
import { RepairOrder, DailyQueue, PaintBatch, TraceEvent } from '@shared/types';
import { api } from '@/utils/api';

interface RepairState {
  dailyQueue: DailyQueue | null;
  selectedDate: string;
  batches: PaintBatch[];
  currentOrder: RepairOrder | null;
  traceEvents: TraceEvent[];
  loading: boolean;
  error: string | null;

  setSelectedDate: (date: string) => void;
  fetchDailyQueue: (date?: string) => Promise<void>;
  fetchBatches: (keyword?: string) => Promise<void>;
  fetchTrace: (id: string) => Promise<void>;
  clearCurrentOrder: () => void;
}

export const useRepairStore = create<RepairState>((set, get) => ({
  dailyQueue: null,
  selectedDate: new Date().toISOString().split('T')[0],
  batches: [],
  currentOrder: null,
  traceEvents: [],
  loading: false,
  error: null,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    get().fetchDailyQueue(date);
  },

  fetchDailyQueue: async (date?: string) => {
    set({ loading: true, error: null });
    try {
      const targetDate = date || get().selectedDate;
      const response = await api.queue.getDaily(targetDate);
      if (response.success && response.data) {
        set({ dailyQueue: response.data, selectedDate: targetDate });
      } else {
        set({ error: response.error || '获取队列失败' });
      }
    } catch (error: any) {
      set({ error: error.message || '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchBatches: async (keyword?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.batches.getAll(keyword);
      if (response.success && response.data) {
        set({ batches: response.data });
      } else {
        set({ error: response.error || '获取批次失败' });
      }
    } catch (error: any) {
      set({ error: error.message || '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTrace: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.repairs.getTrace(id);
      if (response.success && response.data) {
        set({
          currentOrder: response.data.order,
          traceEvents: response.data.events,
        });
      } else {
        set({ error: response.error || '获取追溯信息失败' });
      }
    } catch (error: any) {
      set({ error: error.message || '网络错误' });
    } finally {
      set({ loading: false });
    }
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null, traceEvents: [] });
  },
}));
