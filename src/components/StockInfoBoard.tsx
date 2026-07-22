import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, BarChart3, Newspaper, Link2, Lightbulb } from 'lucide-react';
import type { Stock } from '../types';

export interface StockInfo {
  ceoComment: string | null;
  stockPrice: string;
  earnings: string;
  nextEarningsDate: string;
  per: string;
  rsi: string;
  topics: string[];
  relatedStocks: string[];
  buyTimingAnalysis: string;
}

interface Entry {
  status: 'loading' | 'done' | 'error';
  info?: StockInfo;
  error?: string;
}

interface Props {
  stocks: Stock[];
  hasApiKey: boolean;
  getStockInfo: (ticker: string, name: string) => Promise<StockInfo>;
}

export default function StockInfoBoard({ stocks, hasApiKey, getStockInfo }: Props) {
  const [entries, setEntries] = useState<Record<string, Entry>>({});

  const fetchAll = async () => {
    for (const stock of stocks) {
      setEntries((e) => ({ ...e, [stock.id]: { status: 'loading' } }));
      try {
        const info = await getStockInfo(stock.ticker, stock.name);
        setEntries((e) => ({ ...e, [stock.id]: { status: 'done', info } }));
      } catch (err) {
        setEntries((e) => ({
          ...e,
          [stock.id]: { status: 'error', error: err instanceof Error ? err.message : '取得に失敗しました' },
        }));
      }
    }
  };

  useEffect(() => {
    if (hasApiKey && stocks.length > 0) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey, stocks.map((s) => s.id).join(',')]);

  if (stocks.length === 0) {
    return <p className="empty">保有銘柄がありません。「銘柄を追加」ボタンから追加してください。</p>;
  }

  if (!hasApiKey) {
    return (
      <div className="alert alert-warning">
        「設定」からClaude APIキーを設定してください
      </div>
    );
  }

  return (
    <div className="info-board">
      <div className="info-board-header">
        <h2>銘柄情報一覧</h2>
        <button className="btn btn-secondary btn-sm" onClick={fetchAll}>
          <RefreshCw size={14} /> 再取得
        </button>
      </div>

      {stocks.map((stock) => {
        const entry = entries[stock.id];
        return (
          <div key={stock.id} className="info-card">
            <div className="detail-title">
              <span className="detail-ticker">{stock.ticker}</span>
              <span className={`badge badge-${stock.currency.toLowerCase()}`}>{stock.currency}</span>
              <span className="detail-name">{stock.name}</span>
            </div>

            {(!entry || entry.status === 'loading') && (
              <div className="detail-loading">
                <RefreshCw size={16} className="spinning" /> AIで情報を取得中…
              </div>
            )}

            {entry?.status === 'error' && (
              <p className="error-text">⚠ {entry.error}</p>
            )}

            {entry?.status === 'done' && entry.info && (
              <div className="detail-sections">
                <section className="detail-section">
                  <h3><TrendingUp size={14} /> 社長(CEO)コメント</h3>
                  <p>{entry.info.ceoComment ?? 'コメントなし'}</p>
                </section>
                <section className="detail-section">
                  <h3><BarChart3 size={14} /> 株価・決算・指標</h3>
                  <p>株価: {entry.info.stockPrice}</p>
                  <p>決算: {entry.info.earnings}</p>
                  <p>次回決算日: {entry.info.nextEarningsDate}</p>
                  <p>PER: {entry.info.per}</p>
                  <p>RSI: {entry.info.rsi}</p>
                </section>
                <section className="detail-section">
                  <h3><Newspaper size={14} /> トピック</h3>
                  <ul className="news-list">
                    {entry.info.topics.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </section>
                <section className="detail-section">
                  <h3><Link2 size={14} /> 関連する銘柄</h3>
                  <p>{entry.info.relatedStocks.join('、') || 'なし'}</p>
                </section>
                <section className="detail-section">
                  <h3><Lightbulb size={14} /> 購入タイミングの考察</h3>
                  <p>{entry.info.buyTimingAnalysis}</p>
                </section>
              </div>
            )}
          </div>
        );
      })}

      <p className="detail-disclaimer">※ 情報はAIによる生成のため、最新情報は各社IRや証券会社でご確認ください</p>
    </div>
  );
}
