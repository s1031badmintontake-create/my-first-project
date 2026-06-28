import { useState, useEffect } from 'react';
import { X, RefreshCw, TrendingUp, Newspaper, CalendarDays, Building2 } from 'lucide-react';
import type { Stock } from '../types';
import { calcGain, formatCurrency, formatPercent, toJpy, formatJpy } from '../utils';

interface StockInfo {
  overview: string;
  ceoName: string;
  ceoComment: string;
  news: string[];
  earningsDate: string;
}

interface Props {
  stock: Stock;
  usdJpy: number;
  onClose: () => void;
  hasApiKey: boolean;
  getStockInfo: (ticker: string, name: string) => Promise<StockInfo>;
}

export default function StockDetailModal({ stock, usdJpy, onClose, hasApiKey, getStockInfo }: Props) {
  const [info, setInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { value, gain, gainPercent } = calcGain(stock);
  const isPositive = gain >= 0;
  const valueJpy = toJpy(value, stock.currency, usdJpy);

  const fetchInfo = async () => {
    if (!hasApiKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getStockInfo(stock.ticker, stock.name);
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInfo(); }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-title">
            <span className="detail-ticker">{stock.ticker}</span>
            <span className={`badge badge-${stock.currency.toLowerCase()}`}>{stock.currency}</span>
            <span className="detail-name">{stock.name}</span>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="detail-summary">
          <div className="detail-stat">
            <span className="detail-label">現在値</span>
            <span className="detail-val">{formatCurrency(stock.currentPrice, stock.currency)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-label">取得単価</span>
            <span className="detail-val">{formatCurrency(stock.purchasePrice, stock.currency)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-label">損益</span>
            <span className={`detail-val ${isPositive ? 'gain' : 'loss'}`}>
              {formatCurrency(gain, stock.currency)}<br />
              <small>{formatPercent(gainPercent)}</small>
            </span>
          </div>
          <div className="detail-stat">
            <span className="detail-label">評価額(円)</span>
            <span className="detail-val">{formatJpy(valueJpy)}</span>
          </div>
        </div>

        {!hasApiKey && (
          <div className="alert alert-warning">
            「設定」からClaude APIキーを設定すると、以下の情報が表示されます
          </div>
        )}

        {loading && (
          <div className="detail-loading">
            <RefreshCw size={20} className="spinning" />
            AIで情報を取得中…
          </div>
        )}

        {error && (
          <div className="alert alert-warning">
            {error}
            <button className="btn btn-sm btn-secondary" onClick={fetchInfo} style={{ marginLeft: 12 }}>
              再試行
            </button>
          </div>
        )}

        {info && (
          <div className="detail-sections">
            <section className="detail-section">
              <h3><Building2 size={15} /> 会社概要</h3>
              <p>{info.overview}</p>
            </section>
            <section className="detail-section">
              <h3><TrendingUp size={15} /> 社長・CEOコメント</h3>
              <p className="ceo-name">{info.ceoName}</p>
              <p>{info.ceoComment}</p>
            </section>
            <section className="detail-section">
              <h3><Newspaper size={15} /> 直近のニュース</h3>
              <ul className="news-list">
                {info.news.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </section>
            <section className="detail-section">
              <h3><CalendarDays size={15} /> 決算日</h3>
              <p className="earnings-date">{info.earningsDate}</p>
            </section>
          </div>
        )}

        <p className="detail-disclaimer">※ 情報はAIによる生成のため、最新情報は各社IRや証券会社でご確認ください</p>
      </div>
    </div>
  );
}
