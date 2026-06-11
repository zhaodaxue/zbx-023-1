import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, RefreshCw, AlertTriangle, Sparkles, Users } from 'lucide-react';
import { useRepairStore } from '@/store/useRepairStore';
import { SLOT_LABELS, SandboxSlot } from '@shared/types';

export default function Sandbox() {
  const navigate = useNavigate();
  const { sandbox, sandboxLoading, error, fetchSandbox, setSelectedDate } = useRepairStore();

  useEffect(() => {
    fetchSandbox();
  }, [fetchSandbox]);

  const handleSlotClick = (date: string, slot: 'morning' | 'afternoon', slotData: SandboxSlot) => {
    if (slotData.isFull) return;
    setSelectedDate(date);
    navigate('/queue');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const renderSlotCard = (day: any, slot: 'morning' | 'afternoon') => {
    const slotData = slot === 'morning' ? day.morning : day.afternoon;
    const percentage = Math.min(100, (slotData.total / slotData.capacity) * 100);
    const isFull = slotData.isFull;

    return (
      <div
        key={slot}
        onClick={() => handleSlotClick(day.date, slot, slotData)}
        className={`p-4 rounded-md border-2 transition-all ${
          isFull
            ? 'bg-paper-200 border-paper-300 opacity-60 cursor-not-allowed'
            : 'bg-paper-50 border-paper-300 hover:border-gold-500 hover:shadow-md cursor-pointer'
        } ${day.isToday ? 'ring-2 ring-gold-400/50' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-ink-700 flex items-center gap-1.5">
            <Clock size={14} className="text-bronze-500" />
            {SLOT_LABELS[slot]}
          </span>
          <span className={`text-sm font-bold ${
            isFull ? 'text-cinnabar-600' : 'text-bronze-600'
          }`}>
            {slotData.total}/{slotData.capacity}
          </span>
        </div>

        <div className="h-2 bg-paper-200 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-500 ${
              percentage >= 100 ? 'bg-cinnabar-600' : 'bg-gradient-to-r from-bronze-400 to-bronze-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {isFull && (
          <div className="text-xs text-cinnabar-600 flex items-center gap-1 mb-2">
            <AlertTriangle size={12} />
            槽位已满
          </div>
        )}

        <div className="space-y-1">
          <div className="text-xs text-ink-400 mb-1.5 flex items-center gap-1">
            <Sparkles size={10} className="text-gold-500" />
            剥落插队额度
          </div>
          <div className="flex flex-wrap gap-1">
            {slotData.jumpQuotas.filter((q: any) => q.used > 0).length === 0 ? (
              <span className="text-xs text-ink-400">暂无占用</span>
            ) : (
              slotData.jumpQuotas
                .filter((q: any) => q.used > 0)
                .map((quota: any) => (
                  <span
                    key={quota.faceStyle}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      quota.remaining <= 0
                        ? 'bg-cinnabar-100 text-cinnabar-700'
                        : 'bg-gold-100 text-gold-700'
                    }`}
                  >
                    {quota.faceStyle} {quota.used}/{quota.quota}
                  </span>
                ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-scroll-reveal origin-top">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Calendar className="text-gold-500" />
            七日排期沙盘
          </h1>
          <p className="text-ink-500">查看未来 7 天的修复排期情况，点击未满槽位跳转至当日队列</p>
        </div>
        <button
          onClick={() => fetchSandbox()}
          className="btn-secondary flex items-center gap-2"
          disabled={sandboxLoading}
        >
          <RefreshCw size={18} className={sandboxLoading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-cinnabar-50 border border-cinnabar-200 rounded-md flex items-center gap-3 text-cinnabar-700">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {sandboxLoading && sandbox.length === 0 ? (
        <div className="scroll-card p-12 text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-bronze-500" size={32} />
          <p className="text-ink-500">加载沙盘数据...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {sandbox.map((day) => (
            <div
              key={day.date}
              className={`scroll-card p-4 ${
                day.isToday ? 'border-gold-400 bg-gold-50/30' : ''
              }`}
            >
              <div className="text-center mb-4 pb-3 border-b border-paper-300">
                <div className={`text-lg font-bold ${
                  day.isToday ? 'text-cinnabar-700' : 'text-ink-700'
                }`}>
                  {formatDate(day.date)}
                </div>
                <div className={`text-sm ${
                  day.isToday ? 'text-cinnabar-500' : 'text-ink-400'
                }`}>
                  {day.weekday}
                  {day.isToday && ' · 今天'}
                </div>
              </div>

              <div className="space-y-3">
                {renderSlotCard(day, 'morning')}
                {renderSlotCard(day, 'afternoon')}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-paper-100 border border-paper-300 rounded-md">
        <div className="flex items-start gap-3">
          <Users size={18} className="text-bronze-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-600">
            <div className="font-medium text-ink-700 mb-1">说明</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>每槽位容量为 3 件，点击未满槽位可查看当日详细队列</li>
              <li>「剥落」等级的偶头可自动插队，每脸谱每日最多插队 2 件</li>
              <li>插队额度用尽时，该脸谱的「剥落」工单将无法提交</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
