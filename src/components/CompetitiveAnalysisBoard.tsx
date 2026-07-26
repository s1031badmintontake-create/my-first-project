import { useState } from 'react';
import { RefreshCw, Layers, X, PlusCircle, MessageCircleQuestion } from 'lucide-react';
import type { Stock } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SectorQa {
  question: string;
  answer: string;
}

interface Props {
  stocks: Stock[];
  hasApiKey: boolean;
  askAboutSector: (
    sectorName: string,
    question: string,
    stocks: Array<{ ticker: string; name: string }>
  ) => Promise<string>;
}

const DEFAULT_SECTORS = ['宇宙', '量子', 'フィジカルAI'];

export default function CompetitiveAnalysisBoard({ stocks, hasApiKey, askAboutSector }: Props) {
  const [sectors, setSectors] = useLocalStorage<string[]>('competitiveSectors', DEFAULT_SECTORS);
  const [newSector, setNewSector] = useState('');

  const [questionInputs, setQuestionInputs] = useLocalStorage<Record<string, string>>('sectorQuestionInputs', {});
  const [qaCache, setQaCache] = useLocalStorage<Record<string, SectorQa>>('sectorQuestionCache', {});
  const [qaPending, setQaPending] = useState<Record<string, 'loading' | 'error'>>({});
  const [qaErrors, setQaErrors] = useState<Record<string, string>>({});

  const addSector = () => {
    const name = newSector.trim();
    if (!name || sectors.includes(name)) return;
    setSectors((prev) => [...prev, name]);
    setNewSector('');
  };

  const removeSector = (name: string) => {
    setSectors((prev) => prev.filter((s) => s !== name));
    setQaCache((c) => {
      const next = { ...c };
      delete next[name];
      return next;
    });
  };

  const askSector = async (sectorName: string) => {
    const question = (questionInputs[sectorName] ?? '').trim();
    if (!question) return;
    setQaPending((p) => ({ ...p, [sectorName]: 'loading' }));
    try {
      const answer = await askAboutSector(
        sectorName,
        question,
        stocks.map((s) => ({ ticker: s.ticker, name: s.name }))
      );
      setQaCache((c) => ({ ...c, [sectorName]: { question, answer } }));
      setQaPending((p) => {
        const next = { ...p };
        delete next[sectorName];
        return next;
      });
    } catch (err) {
      setQaPending((p) => ({ ...p, [sectorName]: 'error' }));
      setQaErrors((e) => ({ ...e, [sectorName]: err instanceof Error ? err.message : '取得に失敗しました' }));
    }
  };

  return (
    <div className="info-board">
      <div className="info-board-header">
        <h2>競合分析</h2>
      </div>

      <div className="sector-add-row">
        <input
          type="text"
          value={newSector}
          onChange={(e) => setNewSector(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addSector(); }}
          placeholder="分野を追加（例: 半導体）"
        />
        <button className="btn btn-secondary btn-sm" onClick={addSector}>
          <PlusCircle size={14} /> 追加
        </button>
      </div>

      {!hasApiKey && (
        <div className="alert alert-warning">
          「設定」からClaude APIキーを設定すると分野について質問できます
        </div>
      )}

      {sectors.length === 0 && (
        <p className="empty">分野がありません。上のフォームから追加してください。</p>
      )}

      {sectors.map((sectorName) => (
        <div key={sectorName} className="info-card">
          <div className="detail-title">
            <span className="detail-ticker"><Layers size={16} /> {sectorName}</span>
            <button className="icon-btn danger" title="分野を削除" onClick={() => removeSector(sectorName)}>
              <X size={16} />
            </button>
          </div>

          {hasApiKey && (
            <div className="sector-qa">
              <div className="sector-add-row">
                <input
                  type="text"
                  value={questionInputs[sectorName] ?? ''}
                  onChange={(e) => setQuestionInputs((q) => ({ ...q, [sectorName]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') askSector(sectorName); }}
                  placeholder="この分野について自由に質問する（例: 今一番狙い目はどこ？）"
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => askSector(sectorName)}
                  disabled={qaPending[sectorName] === 'loading'}
                >
                  <MessageCircleQuestion size={14} className={qaPending[sectorName] === 'loading' ? 'spinning' : ''} />
                  質問する
                </button>
              </div>

              {qaPending[sectorName] === 'loading' && (
                <div className="detail-loading">
                  <RefreshCw size={16} className="spinning" /> 回答を考え中…
                </div>
              )}

              {qaPending[sectorName] === 'error' && (
                <p className="error-text">⚠ {qaErrors[sectorName]}</p>
              )}

              {qaCache[sectorName] && (
                <section className="detail-section sector-qa-answer">
                  <h3>Q. {qaCache[sectorName].question}</h3>
                  <p>{qaCache[sectorName].answer}</p>
                </section>
              )}

              {!qaCache[sectorName] && qaPending[sectorName] !== 'loading' && (
                <p className="table-hint">質問を入力して「質問する」を押すと回答が表示されます</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
