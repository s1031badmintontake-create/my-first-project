import { useState } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import type { Stock } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calcPortfolioSummary } from './utils';
import SummaryCard from './components/SummaryCard';
import StockTable from './components/StockTable';
import StockForm from './components/StockForm';
import PriceUpdateForm from './components/PriceUpdateForm';
import './App.css';

type View = 'portfolio' | 'add' | 'edit' | 'prices';

export default function App() {
  const [stocks, setStocks] = useLocalStorage<Stock[]>('stocks', []);
  const [view, setView] = useState<View>('portfolio');
  const [editTarget, setEditTarget] = useState<Stock | null>(null);

  const summary = calcPortfolioSummary(stocks);

  const handleSave = (stock: Stock) => {
    setStocks((prev) =>
      editTarget
        ? prev.map((s) => (s.id === stock.id ? stock : s))
        : [...prev, stock]
    );
    setEditTarget(null);
    setView('portfolio');
  };

  const handleEdit = (stock: Stock) => {
    setEditTarget(stock);
    setView('edit');
  };

  const handleDelete = (id: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePriceUpdate = (id: string, price: number) => {
    setStocks((prev) => prev.map((s) => (s.id === id ? { ...s, currentPrice: price } : s)));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>株ポートフォリオ管理</h1>
        <nav className="nav">
          <button
            className={`nav-btn ${view === 'portfolio' ? 'active' : ''}`}
            onClick={() => { setView('portfolio'); setEditTarget(null); }}
          >
            ポートフォリオ
          </button>
          <button
            className={`nav-btn ${view === 'prices' ? 'active' : ''}`}
            onClick={() => setView('prices')}
          >
            <RefreshCw size={15} /> 値段更新
          </button>
          <button
            className="nav-btn btn-add"
            onClick={() => { setEditTarget(null); setView('add'); }}
          >
            <PlusCircle size={15} /> 銘柄を追加
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'portfolio' && (
          <>
            <SummaryCard summary={summary} />
            <StockTable stocks={stocks} onEdit={handleEdit} onDelete={handleDelete} />
          </>
        )}
        {(view === 'add' || view === 'edit') && (
          <StockForm
            initial={editTarget ?? undefined}
            onSave={handleSave}
            onCancel={() => { setView('portfolio'); setEditTarget(null); }}
          />
        )}
        {view === 'prices' && (
          <PriceUpdateForm stocks={stocks} onUpdate={handlePriceUpdate} />
        )}
      </main>
    </div>
  );
}
