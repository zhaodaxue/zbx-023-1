import { create } from 'zustand';
import { RepairOrder, DailyQueue, PaintBatch, TraceEvent, SandboxDay } from '@shared/types';
import { api } from '@/utils/api';

interface RepairState {
  dailyQueue: DailyQueue | null;
  selectedDate: string;
  batches: PaintBatch[];
  currentOrder: RepairOrder | null;
  traceEvents: TraceEvent[];
  sandbox: SandboxDay[];
  sandboxLoading: boolean;
  loading: boolean;
  error: string | null;
  refreshVersion: number;

  setSelectedDate: (date: string) => void;
  fetchDailyQueue: (date?: string) => Promise<void>;
  fetchBatches: (keyword?: string) => Promise<void>;
  fetchTrace: (id: string) => Promise<void>;
  fetchSandbox: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearCurrentOrder: () => void;
}

export const useRepairStore = create<RepairState>((set, get) => ({
  dailyQueue: null,
  selectedDate: new Date().toISOString().split('T')[0],
  batches: [],
  currentOrder: null,
  traceEvents: [],
  sandbox: [],
  sandboxLoading: false,
  loading: false,
  error: null,
  refreshVersion: 0,

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

  fetchSandbox: async () => {
    set({ sandboxLoading: true, error: null });
    try {
      const response = await api.queue.getSandbox();
      if (response.success && response.data) {
        set({ sandbox: response.data });
      } else {
        set({ error: response.error || '获取沙盘数据失败' });
      }
    } catch (error: any) {
      set({ error: error.message || '网络错误' });
    } finally {
      set({ sandboxLoading: false });
    }
  },

  refreshAll: async () => {
    const { fetchDailyQueue, fetchSandbox, selectedDate } = get();
    set({ refreshVersion: get().refreshVersion + 1 });
    await Promise.all([
      fetchDailyQueue(selectedDate),
      fetchSandbox(),
    ]);
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null, traceEvents: [] });
  },
}));
