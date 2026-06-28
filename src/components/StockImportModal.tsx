import { useState, useRef } from 'react';
import { X, ImageIcon } from 'lucide-react';
import type { Stock } from '../types';
import { generateId } from '../utils';

interface ParsedStock {
  ticker: string; name: string; quantity: number;
  currentPrice: number; purchasePrice: number; currency: 'JPY' | 'USD';
}

interface Props {
  onImport: (stocks: Stock[]) => void;
  onClose: () => void;
  hasApiKey: boolean;
  parseScreenshot: (base64: string, mediaType: string) => Promise<ParsedStock[]>;
}

export default function StockImportModal({ onImport, onClose, hasApiKey, parseScreenshot }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedStock[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setParsed(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return;
      const [, mediaType, base64] = match;
      setLoading(true);
      try {
        const result = await parseScreenshot(base64, mediaType);
        setParsed(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '読み取りに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImport = () => {
    if (!parsed) return;
    const today = new Date().toISOString().slice(0, 10);
    const stocks: Stock[] = parsed.map((s) => ({
      id: generateId(),
      ticker: s.ticker,
      name: s.name,
      quantity: Number(s.quantity),
      purchasePrice: Number(s.purchasePrice),
      currentPrice: Number(s.currentPrice),
      purchaseDate: today,
      currency: s.currency ?? 'USD',
    }));
    onImport(stocks);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>スクリーンショットから読み込み</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {!hasApiKey && (
          <div className="alert alert-warning">
            「設定」からClaude APIキーを設定してください
          </div>
        )}

        <div
          className="upload-area"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          {preview ? (
            <img src={preview} alt="preview" className="upload-preview" />
          ) : (
            <>
              <ImageIcon size={40} className="upload-icon" />
              <p>SBI証券「保有証券」画面のスクショをタップして選択</p>
              <p className="upload-hint">JPG / PNG 対応</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>

        {loading && <p className="loading-text">AIで読み取り中…しばらくお待ちください</p>}
        {error && <p className="error-text">⚠ {error}</p>}

        {parsed && (
          <div className="parsed-result">
            <h3>{parsed.length}件の銘柄を読み取りました</h3>
            <table className="mini-table">
              <thead>
                <tr><th>コード</th><th>銘柄名</th><th>株数</th><th>現在値</th><th>取得単価</th></tr>
              </thead>
              <tbody>
                {parsed.map((s, i) => (
                  <tr key={i}>
                    <td>{s.ticker}</td>
                    <td>{s.name}</td>
                    <td>{s.quantity}</td>
                    <td>{s.currentPrice}</td>
                    <td>{s.purchasePrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => { setParsed(null); setPreview(null); }}>
                やり直す
              </button>
              <button className="btn btn-primary" onClick={handleImport}>
                インポートする
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
