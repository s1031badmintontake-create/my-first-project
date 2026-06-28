import { RefreshCw } from 'lucide-react';

interface Props {
  rate: number;
  loading: boolean;
  onRefresh: () => void;
  onChange: (rate: number) => void;
}

export default function ExchangeRateBar({ rate, loading, onRefresh, onChange }: Props) {
  return (
    <div className="rate-bar">
      <span className="rate-label">USD/JPY</span>
      <input
        type="number"
        className="rate-input"
        value={rate}
        min={1}
        step={0.01}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="rate-unit">円</span>
      <button className="icon-btn" title="レートを更新" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={14} className={loading ? 'spinning' : ''} />
      </button>
      <span className="rate-note">自動取得・手動変更可</span>
    </div>
  );
}
