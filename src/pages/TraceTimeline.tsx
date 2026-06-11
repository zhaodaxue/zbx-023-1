import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { History, ArrowLeft, ArrowRight, Calendar, Palette, Droplets, AlertTriangle, CheckCircle, Edit3, XCircle, Sparkles, RefreshCw } from 'lucide-react';
import { useRepairStore } from '@/store/useRepairStore';
import {
  CRACK_LEVEL_LABELS,
  SLOT_LABELS,
  STATUS_LABELS,
  TraceEvent,
  RepairOrder,
} from '@shared/types';

const EVENT_ICONS: Record<string, any> = {
  created: Calendar,
  jumped: Sparkles,
  rescheduled: Edit3,
  cancelled: XCircle,
  completed: CheckCircle,
  batch_changed: Droplets,
};

const EVENT_LABELS: Record<string, string> = {
  created: '提交报修',
  jumped: '队列插队',
  rescheduled: '改期',
  cancelled: '撤销工单',
  completed: '修复完工',
  batch_changed: '更换颜料批次',
};

export default function TraceTimeline() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, traceEvents, loading, error, fetchTrace, clearCurrentOrder } = useRepairStore();
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTrace(id);
    }
    return () => clearCurrentOrder();
  }, [id]);

  useEffect(() => {
    if (!id) {
      setShowDemo(true);
      fetchTrace('ro001');
    }
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gold-100 text-gold-700';
      case 'processing': return 'bg-bronze-100 text-bronze-700';
      case 'completed': return 'bg-bronze-500 text-paper-100';
      case 'cancelled': return 'bg-ink-300 text-ink-700';
      case 'rescheduled': return 'bg-cinnabar-100 text-cinnabar-700';
      default: return 'bg-paper-200 text-ink-600';
    }
  };

  return (
    <div className="animate-scroll-reveal origin-top">
      <div className="mb-6">
        <button
          onClick={() => navigate('/queue')}
          className="flex items-center gap-2 text-ink-500 hover:text-cinnabar-600 mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          返回队列
        </button>
        <h1 className="page-title flex items-center gap-3">
          <History className="text-gold-500" />
          单件追溯时间线
        </h1>
        <p className="text-ink-500">查看偶头修复全流程的时间线记录，包括换批追溯信息</p>
      </div>

      {showDemo && (
        <div className="mb-6 p-4 bg-gold-50 border border-gold-200 rounded-md flex items-start gap-3">
          <AlertTriangle className="text-gold-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <div className="font-medium text-gold-700">演示模式</div>
            <div className="text-sm text-gold-600">
              当前展示的是种子数据中的换批记录样例（单号 BX20240601001）
            </div>
          </div>
        </div>
      )}

      {loading && !currentOrder ? (
        <div className="scroll-card p-12 text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-bronze-500" size={32} />
          <p className="text-ink-500">加载追溯信息...</p>
        </div>
      ) : error ? (
        <div className="scroll-card p-12 text-center">
          <AlertTriangle className="mx-auto mb-4 text-cinnabar-500" size={32} />
          <p className="text-cinnabar-600">{error}</p>
        </div>
      ) : currentOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="scroll-card p-6">
              <h2 className="section-title mb-4">
                <Palette className="text-bronze-600" />
                偶头信息
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-paper-300">
                  <span className="text-ink-500">偶头编号</span>
                  <span className="font-display text-xl text-ink-800">{currentOrder.headCode}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-300">
                  <span className="text-ink-500">脸谱样式</span>
                  <span className="font-medium text-ink-800">{currentOrder.faceStyle}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-300">
                  <span className="text-ink-500">龟裂等级</span>
                  <span className={`font-medium ${
                    currentOrder.crackLevel === 'peeling' ? 'text-cinnabar-600' : 'text-ink-800'
                  }`}>
                    {CRACK_LEVEL_LABELS[currentOrder.crackLevel]}
                    {currentOrder.crackLevel === 'peeling' && currentOrder.isJumped && (
                      <span className="stamp-badge ml-2 text-xs">已插队</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-300">
                  <span className="text-ink-500">报修单号</span>
                  <span className="font-mono text-ink-800">{currentOrder.orderNo}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-300">
                  <span className="text-ink-500">修复日期</span>
                  <span className="text-ink-800">{currentOrder.repairDate}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-300">
                  <span className="text-ink-500">修复槽位</span>
                  <span className="text-ink-800">{SLOT_LABELS[currentOrder.slot]}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-paper-300">
                  <span className="text-ink-500">当前状态</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentOrder.status)}`}>
                    {STATUS_LABELS[currentOrder.status]}
                  </span>
                </div>
              </div>

              <div className="scroll-divider" />

              <h3 className="text-sm font-medium text-ink-600 mb-3">颜料批次追溯</h3>

              <div className="p-4 bg-paper-200 rounded-md">
                <div className="text-sm text-ink-500 mb-1">报修批次</div>
                <div className="flex items-center gap-2">
                  <Droplets size={18} className="text-bronze-600" />
                  <span className="font-mono font-medium text-ink-800">{currentOrder.paintBatchCode}</span>
                </div>
              </div>

              {currentOrder.actualPaintBatchCode && currentOrder.actualPaintBatchCode !== currentOrder.paintBatchCode && (
                <>
                  <div className="flex justify-center my-2">
                    <ArrowRight size={20} className="text-gold-500 animate-glow-pulse" />
                  </div>
                  <div className="p-4 bg-gold-100 border-2 border-gold-400 rounded-md relative">
                    <span className="absolute -top-2 left-4 gold-stamp-badge text-xs">换批</span>
                    <div className="text-sm text-gold-700 mb-1">实际耗用批次</div>
                    <div className="flex items-center gap-2">
                      <Droplets size={18} className="text-gold-600" />
                      <span className="font-mono font-medium text-gold-800">{currentOrder.actualPaintBatchCode}</span>
                    </div>
                    {currentOrder.batchChangeNote && (
                      <div className="mt-3 pt-3 border-t border-gold-300">
                        <div className="text-xs text-gold-600 mb-1">换批说明</div>
                        <div className="text-sm text-gold-800">{currentOrder.batchChangeNote}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="scroll-card p-6">
              <h2 className="section-title mb-6">
                <History className="text-bronze-600" />
                修复时间线
              </h2>

              {traceEvents.length === 0 ? (
                <div className="text-center py-12 text-ink-400">
                  <History size={48} className="mx-auto mb-3 opacity-30" />
                  <p>暂无追溯记录</p>
                </div>
              ) : (
                <div className="relative">
                  {traceEvents.map((event: TraceEvent, index: number) => {
                    const Icon = EVENT_ICONS[event.eventType] || Calendar;
                    const isHighlight = event.eventType === 'batch_changed' || event.eventType === 'jumped';

                    return (
                      <div key={event.id} className="timeline-node">
                        <div className={`timeline-dot ${isHighlight ? 'highlight' : ''}`}>
                          {isHighlight && (
                            <Icon size={14} className="text-paper-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <div className={`p-4 rounded-md transition-all hover:shadow-md ${
                          isHighlight
                            ? 'bg-gradient-to-r from-gold-50 to-paper-100 border-2 border-gold-300'
                            : 'bg-paper-100 border border-paper-200'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isHighlight ? 'bg-gold-200 text-gold-800' : 'bg-bronze-100 text-bronze-700'
                              }`}>
                                {EVENT_LABELS[event.eventType] || event.eventType}
                              </span>
                              {isHighlight && (
                                <span className="text-xs text-gold-600 flex items-center gap-1">
                                  <Sparkles size={12} />
                                  关键节点
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-ink-400">
                              {formatDate(event.createdAt)}
                            </span>
                          </div>
                          <div className="text-ink-800 mb-2">{event.eventDesc}</div>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="text-sm text-ink-500 space-y-1">
                              {event.metadata.slot && (
                                <div>槽位：{SLOT_LABELS[event.metadata.slot as keyof typeof SLOT_LABELS] || event.metadata.slot}</div>
                              )}
                              {event.metadata.crackLevel && (
                                <div>龟裂等级：{CRACK_LEVEL_LABELS[event.metadata.crackLevel as keyof typeof CRACK_LEVEL_LABELS] || event.metadata.crackLevel}</div>
                              )}
                              {event.metadata.reason && (
                                <div className="text-cinnabar-600">原因：{event.metadata.reason}</div>
                              )}
                              {event.metadata.oldBatch && event.metadata.newBatch && (
                                <div className="flex items-center gap-2">
                                  <span>批次：{event.metadata.oldBatch}</span>
                                  <ArrowRight size={14} className="text-gold-500" />
                                  <span className="text-gold-700 font-medium">{event.metadata.newBatch}</span>
                                </div>
                              )}
                              {event.metadata.note && (
                                <div className="text-gold-700">说明：{event.metadata.note}</div>
                              )}
                              {event.metadata.oldDate && event.metadata.newDate && (
                                <div className="flex items-center gap-2">
                                  <span>日期：{event.metadata.oldDate}</span>
                                  <ArrowRight size={14} className="text-gold-500" />
                                  <span className="text-gold-700">{event.metadata.newDate}</span>
                                  <span className="text-ink-400 ml-2">
                                    （{SLOT_LABELS[event.metadata.oldSlot as keyof typeof SLOT_LABELS]} → {SLOT_LABELS[event.metadata.newSlot as keyof typeof SLOT_LABELS]}）
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
