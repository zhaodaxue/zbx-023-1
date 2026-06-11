import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Sparkles, Calendar, Palette, Droplets, Clock } from 'lucide-react';
import { api } from '@/utils/api';
import { CreateRepairRequest, CrackLevel, RepairSlot, CRACK_LEVEL_LABELS, SLOT_LABELS, PaintBatch } from '@shared/types';

const FACE_STYLES = ['生角', '旦角', '净角', '末角', '丑角', '花脸'];

export default function RepairForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateRepairRequest>({
    headCode: '',
    faceStyle: '生角',
    crackLevel: 'hairline',
    paintBatchCode: '',
    slot: 'morning',
    repairDate: new Date().toISOString().split('T')[0],
  });

  const [batchValidation, setBatchValidation] = useState<{
    valid: boolean;
    checking: boolean;
    error?: string;
    suggestedBatches?: PaintBatch[];
  }>({ valid: false, checking: false });

  const [slotCapacity, setSlotCapacity] = useState<{ remaining: number; capacity: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; orderNo?: string } | null>(null);

  useEffect(() => {
    if (formData.paintBatchCode.trim()) {
      validateBatch();
    } else {
      setBatchValidation({ valid: false, checking: false });
    }
  }, [formData.paintBatchCode]);

  useEffect(() => {
    if (formData.repairDate && formData.slot) {
      fetchSlotCapacity();
    }
  }, [formData.repairDate, formData.slot]);

  const validateBatch = async () => {
    setBatchValidation({ valid: false, checking: true });
    try {
      const response = await api.batches.checkCompatibility(formData.paintBatchCode.trim());
      setBatchValidation({
        valid: response.valid,
        checking: false,
        error: response.error,
        suggestedBatches: response.suggestedBatches,
      });
    } catch {
      setBatchValidation({ valid: false, checking: false, error: '校验失败' });
    }
  };

  const fetchSlotCapacity = async () => {
    try {
      const response = await api.queue.getCapacity(formData.repairDate, formData.slot);
      if (response.success && response.data) {
        setSlotCapacity({
          remaining: response.data.remaining,
          capacity: response.data.capacity,
        });
      }
    } catch {
      setSlotCapacity(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchValidation.valid || submitting) return;

    setSubmitting(true);
    setResult(null);

    try {
      const response = await api.repairs.create(formData);
      if (response.success && response.data) {
        setResult({
          success: true,
          message: `报修成功！${response.data.isJumped ? '该偶头为「剥落」等级，已自动插队' : ''}`,
          orderNo: response.data.orderNo,
        });
        if (response.data.isJumped) {
          setTimeout(() => navigate('/queue'), 2000);
        } else {
          setTimeout(() => navigate('/queue'), 1500);
        }
      } else {
        setResult({
          success: false,
          message: response.error?.message || '提交失败',
        });
        if (response.error?.suggestedBatches) {
          setBatchValidation({
            valid: false,
            checking: false,
            error: response.error.message,
            suggestedBatches: response.error.suggestedBatches,
          });
        }
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || '网络错误' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSelect = (batchCode: string) => {
    setFormData(prev => ({ ...prev, paintBatchCode: batchCode }));
  };

  return (
    <div className="animate-scroll-reveal origin-top">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-3">
          <Sparkles className="text-gold-500" />
          开脸颜料龟裂报修
        </h1>
        <p className="text-ink-500">请填写偶头修复信息，系统将自动校验批次配伍并安排修复队列</p>
      </div>

      <form onSubmit={handleSubmit} className="scroll-card p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label flex items-center gap-2">
              <Palette size={16} className="text-cinnabar-600" />
              偶头编号
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="如：OH-2024-001"
              value={formData.headCode}
              onChange={(e) => setFormData(prev => ({ ...prev, headCode: e.target.value.toUpperCase() }))}
              required
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Palette size={16} className="text-cinnabar-600" />
              脸谱样式
            </label>
            <select
              className="form-select"
              value={formData.faceStyle}
              onChange={(e) => setFormData(prev => ({ ...prev, faceStyle: e.target.value }))}
            >
              {FACE_STYLES.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <AlertCircle size={16} className="text-cinnabar-600" />
              龟裂等级
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(CRACK_LEVEL_LABELS) as CrackLevel[]).map(level => (
                <label
                  key={level}
                  className={`cursor-pointer p-3 rounded-md border-2 transition-all text-center ${
                    formData.crackLevel === level
                      ? 'border-cinnabar-600 bg-cinnabar-50 text-cinnabar-700'
                      : 'border-paper-300 bg-paper-50 hover:border-bronze-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="crackLevel"
                    value={level}
                    checked={formData.crackLevel === level}
                    onChange={(e) => setFormData(prev => ({ ...prev, crackLevel: e.target.value as CrackLevel }))}
                    className="sr-only"
                  />
                  <div className="font-medium">{CRACK_LEVEL_LABELS[level]}</div>
                  {level === 'peeling' && (
                    <div className="text-xs text-cinnabar-600 mt-1">可插队</div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Droplets size={16} className="text-cinnabar-600" />
              颜料批次
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="如：RED-2024-A01"
              value={formData.paintBatchCode}
              onChange={(e) => setFormData(prev => ({ ...prev, paintBatchCode: e.target.value.toUpperCase() }))}
              required
            />
            {formData.paintBatchCode && (
              <div className="mt-2">
                {batchValidation.checking ? (
                  <span className="text-sm text-ink-500">正在校验配伍...</span>
                ) : batchValidation.valid ? (
                  <span className="text-sm text-bronze-600 flex items-center gap-1">
                    <CheckCircle2 size={16} /> 批次校验通过
                  </span>
                ) : batchValidation.error ? (
                  <div>
                    <span className="text-sm text-cinnabar-600 flex items-center gap-1">
                      <AlertCircle size={16} /> {batchValidation.error}
                    </span>
                    {batchValidation.suggestedBatches && batchValidation.suggestedBatches.length > 0 && (
                      <div className="mt-2 p-3 bg-paper-200 rounded-md">
                        <div className="text-sm text-ink-600 mb-2">可替换批次建议：</div>
                        <div className="flex flex-wrap gap-2">
                          {batchValidation.suggestedBatches.map(batch => (
                            <button
                              key={batch.id}
                              type="button"
                              onClick={() => handleBatchSelect(batch.batchCode)}
                              className="text-sm px-3 py-1 bg-gold-100 text-gold-700 rounded-full hover:bg-gold-200 transition-colors"
                            >
                              {batch.batchCode} ({batch.paintType})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Calendar size={16} className="text-cinnabar-600" />
              修复日期
            </label>
            <input
              type="date"
              className="form-input"
              value={formData.repairDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({ ...prev, repairDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <Clock size={16} className="text-cinnabar-600" />
              修复槽位
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(SLOT_LABELS) as RepairSlot[]).map(slot => (
                <label
                  key={slot}
                  className={`cursor-pointer p-3 rounded-md border-2 transition-all text-center ${
                    formData.slot === slot
                      ? 'border-bronze-600 bg-bronze-50 text-bronze-700'
                      : 'border-paper-300 bg-paper-50 hover:border-bronze-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="slot"
                    value={slot}
                    checked={formData.slot === slot}
                    onChange={(e) => setFormData(prev => ({ ...prev, slot: e.target.value as RepairSlot }))}
                    className="sr-only"
                  />
                  <div className="font-medium">{SLOT_LABELS[slot]}</div>
                  {slotCapacity && formData.slot === slot && (
                    <div className={`text-xs mt-1 ${
                      slotCapacity.remaining > 0 ? 'text-bronze-600' : 'text-cinnabar-600'
                    }`}>
                      剩余 {slotCapacity.remaining}/{slotCapacity.capacity} 位
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="scroll-divider" />

        {formData.crackLevel === 'peeling' && (
          <div className="mb-6 p-4 bg-cinnabar-50 border border-cinnabar-200 rounded-md flex items-start gap-3">
            <Sparkles className="text-cinnabar-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-medium text-cinnabar-700">插队提醒</div>
              <div className="text-sm text-cinnabar-600">
                龟裂等级为「剥落」的偶头将自动插队到当日队列前 30%，但同一脸谱样式全天最多插队 2 件
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className={`mb-6 p-4 rounded-md flex items-center gap-3 ${
            result.success ? 'bg-bronze-50 border border-bronze-200' : 'bg-cinnabar-50 border border-cinnabar-200'
          }`}>
            {result.success ? (
              <CheckCircle2 className="text-bronze-600 flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-cinnabar-600 flex-shrink-0" size={20} />
            )}
            <div>
              <div className={`font-medium ${result.success ? 'text-bronze-700' : 'text-cinnabar-700'}`}>
                {result.success ? '提交成功' : '提交失败'}
              </div>
              <div className={`text-sm ${result.success ? 'text-bronze-600' : 'text-cinnabar-600'}`}>
                {result.message}
                {result.orderNo && <span className="ml-2 font-mono">单号：{result.orderNo}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/queue')}
          >
            查看队列
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!batchValidation.valid || submitting || (slotCapacity !== null && slotCapacity.remaining <= 0)}
          >
            {submitting ? '提交中...' : '提交报修'}
          </button>
        </div>
      </form>
    </div>
  );
}
