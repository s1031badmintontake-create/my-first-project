import { useState } from 'react';
import type { Stock } from '../types';
import { generateId } from '../utils';

interface Props {
  initial?: Stock;
  onSave: (stock: Stock) => void;
  onCancel: () => void;
}

const empty = {
  ticker: '',
  name: '',
  quantity: '',
  purchasePrice: '',
  currentPrice: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  currency: 'USD' as 'JPY' | 'USD',
  note: '',
};

export default function StockForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState(
    initial
      ? {
          ticker: initial.ticker,
          name: initial.name,
          quantity: String(initial.quantity),
          purchasePrice: String(initial.purchasePrice),
          currentPrice: String(initial.currentPrice),
          purchaseDate: initial.purchaseDate,
          currency: initial.currency,
          note: initial.note ?? '',
        }
      : empty
  );

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initial?.id ?? generateId(),
      ticker: form.ticker.toUpperCase().trim(),
      name: form.name.trim(),
      quantity: Number(form.quantity),
      purchasePrice: Number(form.purchasePrice),
      currentPrice: Number(form.currentPrice),
      purchaseDate: form.purchaseDate,
      currency: form.currency,
      note: form.note || undefined,
    });
  };

  const unit = form.currency === 'USD' ? '($)' : '(円)';

  return (
    <form className="stock-form" onSubmit={handleSubmit}>
      <h2>{initial ? '銘柄を編集' : '銘柄を追加'}</h2>
      <div className="form-row">
        <label>
          ティッカー / コード
          <input required value={form.ticker} onChange={set('ticker')} placeholder="例: NVDA / 7203" />
        </label>
        <label>
          銘柄名
          <input required value={form.name} onChange={set('name')} placeholder="例: エヌビディア" />
        </label>
        <label>
          通貨
          <select value={form.currency} onChange={set('currency')}>
            <option value="USD">USD（米国株）</option>
            <option value="JPY">JPY（日本株）</option>
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          保有株数
          <input required type="number" min="0.0001" step="any" value={form.quantity} onChange={set('quantity')} />
        </label>
        <label>
          取得単価 {unit}
          <input required type="number" min="0" step="any" value={form.purchasePrice} onChange={set('purchasePrice')} />
        </label>
        <label>
          現在値 {unit}
          <input required type="number" min="0" step="any" value={form.currentPrice} onChange={set('currentPrice')} />
        </label>
      </div>
      <div className="form-row">
        <label>
          取得日
          <input required type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
        </label>
        <label>
          メモ
          <textarea value={form.note} onChange={set('note')} rows={2} />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="btn btn-primary">{initial ? '更新' : '追加'}</button>
      </div>
    </form>
  );
}
