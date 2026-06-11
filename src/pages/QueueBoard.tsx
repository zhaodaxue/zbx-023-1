import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, RefreshCw, Clock, CheckCircle, XCircle, Edit3, Trash2, History, AlertTriangle } from 'lucide-react';
import { useRepairStore } from '@/store/useRepairStore';
import { api } from '@/utils/api';
import { RepairOrder, CRACK_LEVEL_LABELS, STATUS_LABELS, CompleteRepairRequest, RescheduleRequest } from '@shared/types';

export default function QueueBoard() {
  const navigate = useNavigate();
  const { dailyQueue, selectedDate, loading, error, setSelectedDate, fetchDailyQueue } = useRepairStore();
  const [actionModal, setActionModal] = useState<{
    type: 'complete' | 'reschedule' | 'cancel';
    order: RepairOrder;
  } | null>(null);
  const [completeForm, setCompleteForm] = useState<CompleteRepairRequest>({
    actualPaintBatchCode: '',
    batchChangeNote: '',
  });
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleRequest>({
    newSlot: 'morning',
    newDate: new Date().toISOString().split('T')[0],
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchDailyQueue();
  }, []);

  const handleAction = async (type: 'complete' | 'reschedule' | 'cancel') => {
    if (!actionModal) return;
    setActionLoading(true);
    setActionResult(null);

    try {
      let response;
      if (type === 'complete') {
        if (completeForm.actualPaintBatchCode !== actionModal.order.paintBatchCode && !completeForm.batchChangeNote) {
          setActionResult({ success: false, message: '批次不同时必须填写换批说明' });
          setActionLoading(false);
          return;
        }
        response = await api.repairs.complete(actionModal.order.id, completeForm);
      } else if (type === 'reschedule') {
        response = await api.repairs.reschedule(actionModal.order.id, rescheduleForm);
      } else {
        response = await api.repairs.cancel(actionModal.order.id);
      }

      if (response.success) {
        setActionResult({ success: true, message: '操作成功' });
        setTimeout(() => {
          setActionModal(null);
          setActionResult(null);
          setCompleteForm({ actualPaintBatchCode: '', batchChangeNote: '' });
          fetchDailyQueue();
        }, 1000);
      } else {
        setActionResult({ success: false, message: response.error || '操作失败' });
      }
    } catch (error: any) {
      setActionResult({ success: false, message: error.message || '网络错误' });
    } finally {
      setActionLoading(false);
    }
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

  const canEdit = (order: RepairOrder) => {
    return order.status === 'pending' || order.status === 'processing' || order.status === 'rescheduled';
  };

  const renderSlotSection = (slot: 'morning' | 'afternoon', label: string) => {
    if (!dailyQueue) return null;
    const slotData = slot === 'morning' ? dailyQueue.morning : dailyQueue.afternoon;
    const { orders, slotInfo } = slotData;
    const percentage = Math.min(100, (slotInfo.total / slotInfo.capacity) * 100);

    return (
      <div className="scroll-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            <Clock className="text-bronze-600" />
            {label}
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            slotInfo.remaining > 0 ? 'bg-bronze-100 text-bronze-700' : 'bg-cinnabar-100 text-cinnabar-700'
          }`}>
            {slotInfo.total}/{slotInfo.capacity} 件
          </div>
        </div>

        <div className="mb-4">
          <div className="h-3 bg-paper-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-cinnabar-600' : 'bg-gradient-to-r from-bronze-400 to-bronze-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {percentage >= 100 && (
            <div className="text-xs text-cinnabar-600 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> 槽位已满
            </div>
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-ink-400">
              <Users size={40} className="mx-auto mb-2 opacity-30" />
              <p>暂无修复工单</p>
            </div>
          ) : (
            orders.map((order, index) => (
              <div
                key={order.id}
                className={`p-4 rounded-md border-2 transition-all hover:shadow-md ${
                  order.status === 'cancelled' ? 'opacity-50 border-paper-200 bg-paper-50' :
                  order.isJumped ? 'border-cinnabar-300 bg-cinnabar-50/30' :
                  'border-paper-200 bg-paper-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gold-500 text-paper-100 font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="font-display text-lg text-ink-800">{order.headCode}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(order.status)}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.isJumped && (
                        <span className="stamp-badge animate-stamp text-xs">
                          插队
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-ink-600 ml-11">
                      <div>
                        <span className="text-ink-400">脸谱：</span>{order.faceStyle}
                      </div>
                      <div>
                        <span className="text-ink-400">龟裂：</span>
                        <span className={order.crackLevel === 'peeling' ? 'text-cinnabar-600 font-medium' : ''}>
                          {CRACK_LEVEL_LABELS[order.crackLevel]}
                        </span>
                      </div>
                      <div>
                        <span className="text-ink-400">批次：</span>{order.paintBatchCode}
                      </div>
                    </div>
                    <div className="text-xs text-ink-400 ml-11 mt-1">
                      单号：{order.orderNo} · 提交于 {new Date(order.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>

                  {canEdit(order) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/trace/${order.id}`)}
                        className="p-2 text-bronze-600 hover:bg-bronze-100 rounded transition-colors"
                        title="查看追溯"
                      >
                        <History size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setCompleteForm({
                            actualPaintBatchCode: order.paintBatchCode,
                            batchChangeNote: '',
                          });
                          setActionModal({ type: 'complete', order });
                        }}
                        className="p-2 text-bronze-600 hover:bg-bronze-100 rounded transition-colors"
                        title="完工登记"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setRescheduleForm({
                            newSlot: order.slot,
                            newDate: order.repairDate,
                          });
                          setActionModal({ type: 'reschedule', order });
                        }}
                        className="p-2 text-gold-600 hover:bg-gold-100 rounded transition-colors"
                        title="改期"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'cancel', order })}
                        className="p-2 text-cinnabar-600 hover:bg-cinnabar-100 rounded transition-colors"
                        title="撤销"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                  {!canEdit(order) && (
                    <button
                      onClick={() => navigate(`/trace/${order.id}`)}
                      className="p-2 text-bronze-600 hover:bg-bronze-100 rounded transition-colors"
                      title="查看追溯"
                    >
                      <History size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-scroll-reveal origin-top">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Users className="text-gold-500" />
            当日修复队列
          </h1>
          <p className="text-ink-500">查看和管理当日修复工单，支持完工登记、改期和撤销操作</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-ink-500" />
            <input
              type="date"
              className="form-input w-40"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => fetchDailyQueue()}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-cinnabar-50 border border-cinnabar-200 rounded-md flex items-center gap-3 text-cinnabar-700">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {loading && !dailyQueue ? (
        <div className="scroll-card p-12 text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-bronze-500" size={32} />
          <p className="text-ink-500">加载队列数据...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderSlotSection('morning', '上午槽位')}
          {renderSlotSection('afternoon', '下午槽位')}
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="scroll-card p-6 w-full max-w-md animate-scroll-reveal">
            <h2 className="section-title mb-4">
              {actionModal.type === 'complete' && '完工登记'}
              {actionModal.type === 'reschedule' && '改期'}
              {actionModal.type === 'cancel' && '撤销工单'}
            </h2>

            <div className="mb-4 p-3 bg-paper-200 rounded-md">
              <div className="font-medium text-ink-800">{actionModal.order.headCode}</div>
              <div className="text-sm text-ink-500">
                {actionModal.order.faceStyle} · {CRACK_LEVEL_LABELS[actionModal.order.crackLevel]}
              </div>
              <div className="text-sm text-ink-500">
                当前批次：{actionModal.order.paintBatchCode}
              </div>
            </div>

            {actionModal.type === 'complete' && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">实际耗用颜料批次</label>
                  <input
                    type="text"
                    className="form-input"
                    value={completeForm.actualPaintBatchCode}
                    onChange={(e) => setCompleteForm(prev => ({
                      ...prev,
                      actualPaintBatchCode: e.target.value.toUpperCase()
                    }))}
                    placeholder="输入实际使用的颜料批次"
                    required
                  />
                </div>
                {completeForm.actualPaintBatchCode && completeForm.actualPaintBatchCode !== actionModal.order.paintBatchCode && (
                  <div>
                    <label className="form-label">换批说明 <span className="text-cinnabar-600">*</span></label>
                    <textarea
                      className="form-input min-h-[80px]"
                      value={completeForm.batchChangeNote}
                      onChange={(e) => setCompleteForm(prev => ({
                        ...prev,
                        batchChangeNote: e.target.value
                      }))}
                      placeholder="请说明更换批次的原因..."
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {actionModal.type === 'reschedule' && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">新日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={rescheduleForm.newDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRescheduleForm(prev => ({
                      ...prev,
                      newDate: e.target.value
                    }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">新槽位</label>
                  <select
                    className="form-select"
                    value={rescheduleForm.newSlot}
                    onChange={(e) => setRescheduleForm(prev => ({
                      ...prev,
                      newSlot: e.target.value as 'morning' | 'afternoon'
                    }))}
                  >
                    <option value="morning">上午</option>
                    <option value="afternoon">下午</option>
                  </select>
                </div>
              </div>
            )}

            {actionModal.type === 'cancel' && (
              <p className="text-ink-600 mb-4">
                确定要撤销此工单吗？撤销后将无法恢复，且该槽位名额会释放给其他工单。
              </p>
            )}

            {actionResult && (
              <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
                actionResult.success ? 'bg-bronze-100 text-bronze-700' : 'bg-cinnabar-100 text-cinnabar-700'
              }`}>
                {actionResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {actionResult.message}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setActionModal(null);
                  setActionResult(null);
                }}
                className="btn-secondary"
                disabled={actionLoading}
              >
                取消
              </button>
              <button
                onClick={() => handleAction(actionModal.type)}
                className={actionModal.type === 'cancel' ? 'btn-danger' : 'btn-primary'}
                disabled={actionLoading}
              >
                {actionLoading ? '处理中...' : (
                  actionModal.type === 'complete' ? '确认完工' :
                  actionModal.type === 'reschedule' ? '确认改期' : '确认撤销'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
