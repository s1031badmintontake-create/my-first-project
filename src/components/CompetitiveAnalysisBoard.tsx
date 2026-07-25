import { useState } from 'react';
import { RefreshCw, Building2, Users, Target } from 'lucide-react';
import type { Stock } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface CompetitiveAnalysis {
  field: string;
  overview: string;
  position: string;
}

interface Props {
  stocks: Stock[];
  hasApiKey: boolean;
  getCompetitiveAnalysis: (ticker: string, name: string) => Promise<CompetitiveAnalysis>;
}

export default function CompetitiveAnalysisBoard({ stocks, hasApiKey, getCompetitiveAnalysis }: Props) {
  const [cache, setCache] = useLocalStorage<Record<string, CompetitiveAnalysis>>('competitiveAnalysisCache', {});
  const [pending, setPending] = useState<Record<string, 'loading' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchOne = async (stock: Stock) => {
    setPending((p) => ({ ...p, [stock.id]: 'loading' }));
    try {
      const analysis = await getCompetitiveAnalysis(stock.ticker, stock.name);
      setCache((c) => ({ ...c, [stock.id]: analysis }));
      setPending((p) => {
        const next = { ...p };
        delete next[stock.id];
        return next;
      });
    } catch (err) {
      setPending((p) => ({ ...p, [stock.id]: 'error' }));
      setErrors((e) => ({ ...e, [stock.id]: err instanceof Error ? err.message : '取得に失敗しました' }));
    }
  };

  if (stocks.length === 0) {
    return <p className="empty">保有銘柄がありません。「銘柄を追加」ボタンから追加してください。</p>;
  }

  return (
    <div className="info-board">
      <div className="info-board-header">
        <h2>競合分析</h2>
      </div>

      {!hasApiKey && (
        <div className="alert alert-warning">
          「設定」からClaude APIキーを設定すると競合分析を取得できます
        </div>
      )}

      {stocks.map((stock) => {
        const analysis = cache[stock.id];
        const status = pending[stock.id];
        return (
          <div key={stock.id} className="info-card">
            <div className="detail-title">
              <span className="detail-ticker">{stock.ticker}</span>
              <span className={`badge badge-${stock.currency.toLowerCase()}`}>{stock.currency}</span>
              <span className="detail-name">{stock.name}</span>
              {hasApiKey && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => fetchOne(stock)}
                  disabled={status === 'loading'}
                >
                  <RefreshCw size={14} className={status === 'loading' ? 'spinning' : ''} />
                  {analysis ? '更新' : '取得'}
                </button>
              )}
            </div>

            {status === 'loading' && (
              <div className="detail-loading">
                <RefreshCw size={16} className="spinning" /> AIで分析中…
              </div>
            )}

            {status === 'error' && (
              <p className="error-text">⚠ {errors[stock.id]}</p>
            )}

            {analysis && (
              <div className="detail-sections">
                <section className="detail-section">
                  <h3><Building2 size={14} /> 分野</h3>
                  <p>{analysis.field}</p>
                </section>
                <section className="detail-section">
                  <h3><Users size={14} /> 分野全体の概況</h3>
                  <p>{analysis.overview}</p>
                </section>
                <section className="detail-section">
                  <h3><Target size={14} /> {stock.ticker}の立ち位置</h3>
                  <p>{analysis.position}</p>
                </section>
              </div>
            )}

            {!analysis && !status && hasApiKey && (
              <p className="table-hint">「取得」を押すと競合分析が表示されます</p>
            )}
          </div>
        );
      })}

      {Object.keys(cache).length > 0 && (
        <p className="detail-disclaimer">※ 分析はAIによる生成のため、最新情報は各社IRや証券会社でご確認ください</p>
      )}
    </div>
  );
}
