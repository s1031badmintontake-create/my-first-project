import { useState } from 'react';
import { PlusCircle, RefreshCw, Info, Settings } from 'lucide-react';
import type { Stock } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useExchangeRate } from './hooks/useExchangeRate';
import { useClaudeApi } from './hooks/useClaudeApi';
import { calcPortfolioSummary } from './utils';
import SummaryCard from './components/SummaryCard';
import StockTable from './components/StockTable';
import StockForm from './components/StockForm';
import PriceUpdateForm from './components/PriceUpdateForm';
import ExchangeRateBar from './components/ExchangeRateBar';
import StockInfoBoard from './components/StockInfoBoard';
import ApiKeySetup from './components/ApiKeySetup';
import './App.css';

const INITIAL_STOCKS: Stock[] = [
  { id: '1', ticker: 'IONQ',  name: 'IonQ Inc',                      quantity: 12, purchasePrice: 65.74,  currentPrice: 49.31,  purchaseDate: '2024-01-01', currency: 'USD' },
  { id: '2', ticker: 'NVDA',  name: 'エヌビディア',                    quantity: 3,  purchasePrice: 210.52, currentPrice: 192.53, purchaseDate: '2024-01-01', currency: 'USD' },
  { id: '3', ticker: 'QBTS',  name: 'D ウェイブ クオンタム',           quantity: 12, purchasePrice: 28.91,  currentPrice: 22.76,  purchaseDate: '2024-01-01', currency: 'USD' },
  { id: '4', ticker: 'QUBT',  name: 'クオンタム コンピューティング',   quantity: 3,  purchasePrice: 10.44,  currentPrice: 9.18,   purchaseDate: '2024-01-01', currency: 'USD' },
  { id: '5', ticker: 'RGTI',  name: 'リゲッティ コンピューティング',  quantity: 18, purchasePrice: 24.51,  currentPrice: 18.36,  purchaseDate: '2024-01-01', currency: 'USD' },
  { id: '6', ticker: 'RKLB',  name: 'ロケット ラボ コーポレーション', quantity: 18, purchasePrice: 123.64, currentPrice: 84.54,  purchaseDate: '2024-01-01', currency: 'USD' },
  { id: '7', ticker: 'SOFI',  name: 'ソーファイ テクノロジーズ',      quantity: 5,  purchasePrice: 22.50,  currentPrice: 17.88,  purchaseDate: '2024-01-01', currency: 'USD' },
];

type View = 'portfolio' | 'add' | 'edit' | 'prices' | 'info' | 'settings';

export default function App() {
  const [stocks, setStocks] = useLocalStorage<Stock[]>('stocks', INITIAL_STOCKS);
  const [view, setView] = useState<View>('portfolio');
  const [editTarget, setEditTarget] = useState<Stock | null>(null);
  const { rate, setRate, fetchRate, loading } = useExchangeRate();
  const { apiKey, setApiKey, getStockInfo } = useClaudeApi();

  const summary = calcPortfolioSummary(stocks, rate);

  const handleSave = (stock: Stock) => {
    setStocks((prev) =>
      editTarget ? prev.map((s) => (s.id === stock.id ? stock : s)) : [...prev, stock]
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

  const nav = (v: View) => () => { setView(v); setEditTarget(null); };

  return (
    <div className="app">
      <header className="app-header">
        <h1>株ポートフォリオ管理</h1>
        <nav className="nav">
          <button className={`nav-btn ${view === 'portfolio' ? 'active' : ''}`} onClick={nav('portfolio')}>
            ポートフォリオ
          </button>
          <button className={`nav-btn ${view === 'prices' ? 'active' : ''}`} onClick={nav('prices')}>
            <RefreshCw size={15} /> 値段更新
          </button>
          <button className={`nav-btn ${view === 'info' ? 'active' : ''}`} onClick={nav('info')}>
            <Info size={15} /> 銘柄情報
          </button>
          <button className="nav-btn btn-add" onClick={() => { setEditTarget(null); setView('add'); }}>
            <PlusCircle size={15} /> 銘柄を追加
          </button>
          <button className={`nav-btn ${view === 'settings' ? 'active' : ''}`} onClick={nav('settings')}>
            <Settings size={15} /> 設定
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'portfolio' && (
          <>
            <ExchangeRateBar rate={rate} loading={loading} onRefresh={fetchRate} onChange={setRate} />
            <SummaryCard summary={summary} />
            <StockTable
              stocks={stocks}
              usdJpy={rate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
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
        {view === 'info' && (
          <StockInfoBoard stocks={stocks} hasApiKey={!!apiKey} getStockInfo={getStockInfo} />
        )}
        {view === 'settings' && (
          <ApiKeySetup apiKey={apiKey} onSave={setApiKey} />
        )}
      </main>
    </div>
  );
}
