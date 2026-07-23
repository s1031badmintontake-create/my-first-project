import { useState } from 'react';
import { RefreshCw, TrendingUp, BarChart3, Newspaper, Link2 } from 'lucide-react';
import type { Stock } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils';
import StockChart from './StockChart';

export interface StockInfo {
  ceoComment: string | null;
  stockPrice: string;
  earnings: string;
  nextEarningsDate: string;
  per: string;
  rsi: string;
  topics: string[];
  relatedStocks: string[];
}

interface Props {
  stocks: Stock[];
  hasApiKey: boolean;
  getStockInfo: (ticker: string, name: string) => Promise<StockInfo>;
}

export default function StockInfoBoard({ stocks, hasApiKey, getStockInfo }: Props) {
  const [cache, setCache] = useLocalStorage<Record<string, StockInfo>>('stockInfoCache', {});
  const [pending, setPending] = useState<Record<string, 'loading' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    for (const stock of stocks) {
      setPending((p) => ({ ...p, [stock.id]: 'loading' }));
      try {
        const info = await getStockInfo(stock.ticker, stock.name);
        setCache((c) => ({ ...c, [stock.id]: info }));
        setPending((p) => {
          const next = { ...p };
          delete next[stock.id];
          return next;
        });
      } catch (err) {
        setPending((p) => ({ ...p, [stock.id]: 'error' }));
        setErrors((e) => ({ ...e, [stock.id]: err instanceof Error ? err.message : '取得に失敗しました' }));
      }
    }
  };

  if (stocks.length === 0) {
    return <p className="empty">保有銘柄がありません。「銘柄を追加」ボタンから追加してください。</p>;
  }

  return (
    <div className="info-board">
      <div className="info-board-header">
        <h2>銘柄情報一覧</h2>
        {hasApiKey && (
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}>
            <RefreshCw size={14} /> AI情報を取得
          </button>
        )}
      </div>

      {!hasApiKey && (
        <div className="alert alert-warning">
          「設定」からClaude APIキーを設定するとAI情報(CEOコメント・決算・トピックなど)を取得できます
        </div>
      )}

      {stocks.map((stock) => {
        const info = cache[stock.id];
        const status = pending[stock.id];
        return (
          <div key={stock.id} className="info-card">
            <div className="detail-title">
              <span className="detail-ticker">{stock.ticker}</span>
              <span className={`badge badge-${stock.currency.toLowerCase()}`}>{stock.currency}</span>
              <span className="detail-name">{stock.name}</span>
              <span className="detail-price">{formatCurrency(stock.currentPrice, stock.currency)}</span>
            </div>

            <StockChart ticker={stock.ticker} currency={stock.currency} />

            {status === 'loading' && (
              <div className="detail-loading">
                <RefreshCw size={16} className="spinning" /> AIで情報を取得中…
              </div>
            )}

            {status === 'error' && (
              <p className="error-text">⚠ {errors[stock.id]}</p>
            )}

            {info && (
              <div className="detail-sections">
                <section className="detail-section">
                  <h3><TrendingUp size={14} /> 社長(CEO)コメント</h3>
                  <p>{info.ceoComment ?? 'コメントなし'}</p>
                </section>
                <section className="detail-section">
                  <h3><BarChart3 size={14} /> 株価・決算・指標</h3>
                  <p>株価: {info.stockPrice}</p>
                  <p>決算: {info.earnings}</p>
                  <p>次回決算日: {info.nextEarningsDate}</p>
                  <p>PER: {info.per}</p>
                  <p>RSI: {info.rsi}</p>
                </section>
                <section className="detail-section">
                  <h3><Newspaper size={14} /> トピック</h3>
                  <ul className="news-list">
                    {info.topics.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </section>
                <section className="detail-section">
                  <h3><Link2 size={14} /> 関連する銘柄</h3>
                  <p>{info.relatedStocks.join('、') || 'なし'}</p>
                </section>
              </div>
            )}

            {!info && !status && hasApiKey && (
              <p className="table-hint">「AI情報を取得」を押すとCEOコメントなどが表示されます</p>
            )}
          </div>
        );
      })}

      {Object.keys(cache).length > 0 && (
        <p className="detail-disclaimer">※ AI情報はAIによる生成のため、最新情報は各社IRや証券会社でご確認ください</p>
      )}
    </div>
  );
}
