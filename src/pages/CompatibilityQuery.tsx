import { useState, useEffect } from 'react';
import { FlaskConical, Search, CheckCircle2, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { useRepairStore } from '@/store/useRepairStore';
import { api } from '@/utils/api';
import { PaintBatch } from '@shared/types';

export default function CompatibilityQuery() {
  const { batches, loading, fetchBatches } = useRepairStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<PaintBatch | null>(null);
  const [compatibilityInfo, setCompatibilityInfo] = useState<{
    loading: boolean;
    valid: boolean;
    batch?: PaintBatch;
    compatibleBatches?: PaintBatch[];
    error?: string;
  }>({ loading: false, valid: false });
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleSearch = () => {
    fetchBatches(searchKeyword.trim() || undefined);
  };

  const handleBatchSelect = async (batch: PaintBatch) => {
    setSelectedBatch(batch);
    setCompatibilityInfo({ loading: true, valid: false });
    try {
      const response = await api.batches.getCompatible(batch.batchCode);
      setCompatibilityInfo({
        loading: false,
        valid: response.valid,
        batch: response.batch,
        compatibleBatches: response.compatibleBatches,
        error: response.error,
      });
    } catch {
      setCompatibilityInfo({ loading: false, valid: false, error: '查询失败' });
    }
  };

  const handleDemo = async () => {
    setShowDemo(true);
    setSelectedBatch(null);
    setCompatibilityInfo({ loading: true, valid: false });
    try {
      const response = await api.batches.getCompatible('WHT-2024-A01');
      setCompatibilityInfo({
        loading: false,
        valid: response.valid,
        batch: response.batch,
        compatibleBatches: response.compatibleBatches,
        error: response.error,
      });
      if (response.batch) {
        setSelectedBatch(response.batch);
      }
    } catch {
      setCompatibilityInfo({ loading: false, valid: false, error: '查询失败' });
    }
  };

  return (
    <div className="animate-scroll-reveal origin-top">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-3">
          <FlaskConical className="text-gold-500" />
          颜料批次配伍查询
        </h1>
        <p className="text-ink-500">查询颜料批次的可配伍替换批次，确保开脸修复的颜料兼容性</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="scroll-card p-6">
            <h2 className="section-title mb-4">
              <Search size={20} className="text-bronze-600" />
              批次检索
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="form-input flex-1"
                placeholder="输入批次号或颜料类型..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn-primary px-4">
                <Search size={18} />
              </button>
            </div>

            <button
              onClick={handleDemo}
              className="w-full btn-secondary mb-4 text-sm flex items-center justify-center gap-2"
            >
              <Info size={16} />
              查看「配伍拒绝」样例
            </button>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-ink-400">加载中...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-ink-400">无匹配批次</div>
              ) : (
                batches.map(batch => (
                  <button
                    key={batch.id}
                    onClick={() => handleBatchSelect(batch)}
                    className={`w-full p-3 rounded-md border-2 text-left transition-all ${
                      selectedBatch?.id === batch.id
                        ? 'border-cinnabar-600 bg-cinnabar-50'
                        : 'border-paper-200 bg-paper-50 hover:border-bronze-400'
                    }`}
                  >
                    <div className="font-medium text-ink-800">{batch.batchCode}</div>
                    <div className="text-sm text-ink-500">{batch.paintType}</div>
                    <div className="text-xs text-ink-400 mt-1">
                      生产日期：{batch.manufactureDate}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {showDemo && (
            <div className="mb-6 p-4 bg-cinnabar-50 border border-cinnabar-200 rounded-md flex items-start gap-3">
              <Info className="text-cinnabar-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <div className="font-medium text-cinnabar-700">配伍拒绝样例演示</div>
                <div className="text-sm text-cinnabar-600">
                  批次 WHT-2024-A01（铅白粉）不在可补绘配伍表内，系统将拒绝使用该批次并给出替换建议
                </div>
              </div>
            </div>
          )}

          {!selectedBatch && !compatibilityInfo.loading ? (
            <div className="scroll-card p-12 text-center">
              <FlaskConical size={64} className="mx-auto mb-4 text-paper-300" />
              <p className="text-ink-400">请从左侧选择一个颜料批次查看配伍信息</p>
            </div>
          ) : compatibilityInfo.loading ? (
            <div className="scroll-card p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-ink-400">正在查询配伍信息...</p>
            </div>
          ) : selectedBatch && (
            <div className="scroll-card p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="section-title mb-1">
                    {compatibilityInfo.valid ? (
                      <CheckCircle2 className="text-bronze-600" />
                    ) : (
                      <AlertCircle className="text-cinnabar-600" />
                    )}
                    {selectedBatch.batchCode}
                  </h2>
                  <p className="text-ink-500">{selectedBatch.paintType}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  compatibilityInfo.valid
                    ? 'bg-bronze-100 text-bronze-700'
                    : 'bg-cinnabar-100 text-cinnabar-700'
                }`}>
                  {compatibilityInfo.valid ? '可配伍使用' : '配伍校验不通过'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-paper-200 rounded-md">
                  <div className="text-sm text-ink-500 mb-1">颜料类型</div>
                  <div className="text-lg font-medium text-ink-800">{selectedBatch.paintType}</div>
                </div>
                <div className="p-4 bg-paper-200 rounded-md">
                  <div className="text-sm text-ink-500 mb-1">生产日期</div>
                  <div className="text-lg font-medium text-ink-800">{selectedBatch.manufactureDate}</div>
                </div>
              </div>

              {!compatibilityInfo.valid && compatibilityInfo.error && (
                <div className="mb-6 p-4 bg-cinnabar-50 border border-cinnabar-200 rounded-md">
                  <div className="font-medium text-cinnabar-700 mb-2">配伍校验结果</div>
                  <p className="text-cinnabar-600">{compatibilityInfo.error}</p>
                </div>
              )}

              <div className="scroll-divider" />

              <h3 className="section-title">
                {compatibilityInfo.valid ? '可配伍替换批次' : '建议替换批次'}
              </h3>

              {!compatibilityInfo.compatibleBatches || compatibilityInfo.compatibleBatches.length === 0 ? (
                <div className="text-center py-8 text-ink-400">
                  {compatibilityInfo.valid ? '暂无配伍批次记录' : '暂无建议替换批次'}
                </div>
              ) : (
                <div className="space-y-3">
                  {compatibilityInfo.compatibleBatches.map((compBatch, index) => (
                    <div
                      key={compBatch.id}
                      className="flex items-center gap-4 p-4 bg-paper-100 border border-paper-300 rounded-md hover:border-gold-400 transition-colors"
                    >
                      {index === 0 && compatibilityInfo.valid && (
                        <span className="gold-stamp-badge text-xs">推荐</span>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-lg text-ink-800">{compBatch.batchCode}</span>
                          <ArrowRight size={16} className="text-bronze-400" />
                          <span className="text-ink-600">{compBatch.paintType}</span>
                        </div>
                        <div className="text-sm text-ink-400 mt-1">
                          生产日期：{compBatch.manufactureDate}
                        </div>
                      </div>
                      <button
                        onClick={() => handleBatchSelect(compBatch)}
                        className="text-sm text-bronze-600 hover:text-bronze-700 flex items-center gap-1"
                      >
                        查看详情
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {compatibilityInfo.valid && (
                <div className="mt-6 p-4 bg-bronze-50 border border-bronze-200 rounded-md">
                  <div className="text-sm text-bronze-700 flex items-start gap-2">
                    <Info size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium mb-1">配伍规则说明</div>
                      <p className="text-bronze-600">
                        可补绘配伍表中的批次经过严格的成分配比测试，确保色泽、附着力、耐久性等指标一致。
                        不在配伍表内的批次可能导致修复后出现色差、脱落等问题，严禁使用。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
