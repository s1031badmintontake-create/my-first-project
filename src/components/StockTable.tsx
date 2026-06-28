import { Pencil, Trash2 } from 'lucide-react';
import type { Stock } from '../types';
import { calcGain, formatCurrency, formatPercent } from '../utils';

interface Props {
  stocks: Stock[];
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
}

export default function StockTable({ stocks, onEdit, onDelete }: Props) {
  if (stocks.length === 0) {
    return <p className="empty">保有銘柄がありません。「銘柄を追加」ボタンから追加してください。</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="stock-table">
        <thead>
          <tr>
            <th>コード</th>
            <th>銘柄名</th>
            <th>保有数</th>
            <th>取得単価</th>
            <th>現在値</th>
            <th>取得額</th>
            <th>評価額</th>
            <th>損益</th>
            <th>損益率</th>
            <th>取得日</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const { cost, value, gain, gainPercent } = calcGain(stock);
            const isPositive = gain >= 0;
            return (
              <tr key={stock.id}>
                <td className="ticker">{stock.ticker}</td>
                <td>{stock.name}</td>
                <td className="num">{stock.quantity.toLocaleString('ja-JP')}</td>
                <td className="num">{formatCurrency(stock.purchasePrice)}</td>
                <td className="num">{formatCurrency(stock.currentPrice)}</td>
                <td className="num">{formatCurrency(cost)}</td>
                <td className="num">{formatCurrency(value)}</td>
                <td className={`num ${isPositive ? 'gain' : 'loss'}`}>{formatCurrency(gain)}</td>
                <td className={`num ${isPositive ? 'gain' : 'loss'}`}>{formatPercent(gainPercent)}</td>
                <td>{stock.purchaseDate}</td>
                <td className="actions">
                  <button className="icon-btn" title="編集" onClick={() => onEdit(stock)}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="削除"
                    onClick={() => {
                      if (window.confirm(`「${stock.name}」を削除しますか？`)) onDelete(stock.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
