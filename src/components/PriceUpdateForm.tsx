import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Stock } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  stocks: Stock[];
  onUpdate: (id: string, price: number) => void;
}

export default function PriceUpdateForm({ stocks, onUpdate }: Props) {
  const [prices, setPrices] = useState<Record<string, string>>({});

  if (stocks.length === 0) return null;

  const handleApply = (stock: Stock) => {
    const val = Number(prices[stock.id]);
    if (val > 0) {
      onUpdate(stock.id, val);
      setPrices((p) => ({ ...p, [stock.id]: '' }));
    }
  };

  return (
    <div className="price-update">
      <h3><RefreshCw size={16} /> 現在値を更新</h3>
      <div className="price-grid">
        {stocks.map((stock) => (
          <div key={stock.id} className="price-row">
            <span className="price-ticker">{stock.ticker}</span>
            <span className={`badge badge-${stock.currency.toLowerCase()}`}>{stock.currency}</span>
            <span className="price-current">{formatCurrency(stock.currentPrice, stock.currency)}</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder={`新しい値 (${stock.currency})`}
              value={prices[stock.id] ?? ''}
              onChange={(e) => setPrices((p) => ({ ...p, [stock.id]: e.target.value }))}
            />
            <button className="btn btn-sm btn-primary" onClick={() => handleApply(stock)}>
              更新
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
