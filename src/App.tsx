import { useState } from 'react';
import { PlusCircle, Info, Settings } from 'lucide-react';
import type { Stock } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useClaudeApi } from './hooks/useClaudeApi';
import StockForm from './components/StockForm';
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

type View = 'add' | 'edit' | 'info' | 'settings';

export default function App() {
  const [stocks, setStocks] = useLocalStorage<Stock[]>('stocks', INITIAL_STOCKS);
  const [view, setView] = useState<View>('info');
  const [editTarget, setEditTarget] = useState<Stock | null>(null);
  const { apiKey, setApiKey, getStockInfo } = useClaudeApi();

  const handleSave = (stock: Stock) => {
    setStocks((prev) =>
      editTarget ? prev.map((s) => (s.id === stock.id ? stock : s)) : [...prev, stock]
    );
    setEditTarget(null);
    setView('info');
  };

  const handleEdit = (stock: Stock) => {
    setEditTarget(stock);
    setView('edit');
  };

  const nav = (v: View) => () => { setEditTarget(null); setView(v); };

  return (
    <div className="app">
      <header className="app-header">
        <h1>株ポートフォリオ管理</h1>
        <nav className="nav">
          <button className={`nav-btn ${view === 'info' ? 'active' : ''}`} onClick={nav('info')}>
            <Info size={15} /> 銘柄情報
          </button>
          <button className="nav-btn btn-add" onClick={nav('add')}>
            <PlusCircle size={15} /> 銘柄を追加
          </button>
          <button className={`nav-btn ${view === 'settings' ? 'active' : ''}`} onClick={nav('settings')}>
            <Settings size={15} /> 設定
          </button>
        </nav>
      </header>

      <main className="app-main">
        {(view === 'add' || view === 'edit') && (
          <StockForm initial={editTarget ?? undefined} onSave={handleSave} onCancel={nav('info')} />
        )}
        {view === 'info' && (
          <StockInfoBoard
            stocks={stocks}
            hasApiKey={!!apiKey}
            getStockInfo={getStockInfo}
            onEdit={handleEdit}
          />
        )}
        {view === 'settings' && (
          <ApiKeySetup apiKey={apiKey} onSave={setApiKey} />
        )}
      </main>
    </div>
  );
}
