import { useEffect, useState } from 'react';
import { Clock, Sparkles, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { api } from '@/utils/api';
import { SlotPreviewResult, RepairSlot, CrackLevel, CRACK_LEVEL_LABELS, SLOT_LABELS } from '@shared/types';
import { useRepairStore } from '@/store/useRepairStore';

interface SlotPreviewBarProps {
  date: string;
  slot: RepairSlot;
  faceStyle: string;
  crackLevel: CrackLevel;
  onCanSubmitChange?: (canSubmit: boolean, reason?: string) => void;
}

export default function SlotPreviewBar({
  date,
  slot,
  faceStyle,
  crackLevel,
  onCanSubmitChange,
}: SlotPreviewBarProps) {
  const { refreshVersion } = useRepairStore();
  const [preview, setPreview] = useState<SlotPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date || !slot || !faceStyle || !crackLevel) return;

    let cancelled = false;
    setLoading(true);

    const fetchPreview = async () => {
      try {
        const response = await api.queue.getPreview(date, slot, faceStyle, crackLevel);
        if (!cancelled && response.success && response.data) {
          setPreview(response.data);
          onCanSubmitChange?.(response.data.canSubmit, response.data.rejectReason);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      cancelled = true;
    };
  }, [date, slot, faceStyle, crackLevel, refreshVersion, onCanSubmitChange]);

  if (loading && !preview) {
    return (
      <div className="p-4 bg-paper-200 rounded-md flex items-center justify-center text-ink-400">
        <Clock className="animate-spin mr-2" size={16} />
        正在计算排队位次...
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const percentage = Math.min(100, (preview.totalOrders / preview.capacity) * 100);

  return (
    <div className="p-4 bg-paper-100 border-2 border-paper-300 rounded-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-bronze-600" />
          <span className="font-medium text-ink-700">
            {date} {SLOT_LABELS[slot]}槽位
          </span>
        </div>
        <span className={`text-sm font-medium ${
          preview.isSlotFull ? 'text-cinnabar-600' : 'text-bronze-600'
        }`}>
          {preview.totalOrders}/{preview.capacity} 件
        </span>
      </div>

      <div className="mb-3">
        <div className="h-2.5 bg-paper-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percentage >= 100 ? 'bg-cinnabar-600' : 'bg-gradient-to-r from-bronze-400 to-bronze-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-ink-500">预计位次：</span>
          <span className={`font-bold ${
            preview.willJump ? 'text-cinnabar-600' : 'text-ink-700'
          }`}>
            第 {preview.estimatedPosition} 位
          </span>
        </div>

        {preview.willJump && (
          <span className="stamp-badge text-xs">
            <Sparkles size={12} className="inline mr-1" />
            插队
          </span>
        )}
      </div>

      {crackLevel === 'peeling' && (
        <div className="mt-3 pt-3 border-t border-paper-300">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">
              「{faceStyle}」插队额度：
            </span>
            <span className={`font-medium ${
              preview.jumpQuotaRemaining > 0 ? 'text-bronze-600' : 'text-cinnabar-600'
            }`}>
              {preview.jumpQuotaUsed}/{preview.jumpQuotaTotal} 件
            </span>
          </div>
          <div className="h-1.5 bg-paper-200 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full transition-all duration-500 ${
                preview.jumpQuotaRemaining > 0 ? 'bg-gold-500' : 'bg-cinnabar-500'
              }`}
              style={{ width: `${(preview.jumpQuotaUsed / preview.jumpQuotaTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!preview.canSubmit && preview.rejectReason && (
        <div className="mt-3 pt-3 border-t border-paper-300">
          <div className="flex items-start gap-2 text-cinnabar-600">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">{preview.rejectReason}</span>
          </div>
        </div>
      )}

      {preview.canSubmit && (
        <div className="mt-3 pt-3 border-t border-paper-300">
          <div className="flex items-center gap-2 text-bronze-600">
            <CheckCircle2 size={16} />
            <span className="text-sm">
              {preview.willJump
                ? `「${CRACK_LEVEL_LABELS[crackLevel]}」将自动插队到前 30%`
                : '可正常提交报修'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
