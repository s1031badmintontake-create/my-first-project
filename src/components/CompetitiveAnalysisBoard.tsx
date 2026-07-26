import { useState } from 'react';
import { RefreshCw, Layers, X, PlusCircle, MessageCircleQuestion } from 'lucide-react';
import type { Stock } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface SectorComparison {
  summary: string;
  companies: Array<{ name: string; ticker: string | null; held: boolean; analysis: string }>;
}

interface SectorQa {
  question: string;
  answer: string;
}

interface Props {
  stocks: Stock[];
  hasApiKey: boolean;
  getSectorComparison: (
    sectorName: string,
    stocks: Array<{ ticker: string; name: string }>
  ) => Promise<SectorComparison>;
  askAboutSector: (
    sectorName: string,
    question: string,
    stocks: Array<{ ticker: string; name: string }>
  ) => Promise<string>;
}

const DEFAULT_SECTORS = ['宇宙', '量子', 'フィジカルAI'];

export default function CompetitiveAnalysisBoard({ stocks, hasApiKey, getSectorComparison, askAboutSector }: Props) {
  const [sectors, setSectors] = useLocalStorage<string[]>('competitiveSectors', DEFAULT_SECTORS);
  const [cache, setCache] = useLocalStorage<Record<string, SectorComparison>>('sectorComparisonCache', {});
  const [pending, setPending] = useState<Record<string, 'loading' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSector, setNewSector] = useState('');

  const [questionInputs, setQuestionInputs] = useState<Record<string, string>>({});
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
    setCache((c) => {
      const next = { ...c };
      delete next[name];
      return next;
    });
    setQaCache((c) => {
      const next = { ...c };
      delete next[name];
      return next;
    });
  };

  const fetchOne = async (sectorName: string) => {
    setPending((p) => ({ ...p, [sectorName]: 'loading' }));
    try {
      const result = await getSectorComparison(
        sectorName,
        stocks.map((s) => ({ ticker: s.ticker, name: s.name }))
      );
      setCache((c) => ({ ...c, [sectorName]: result }));
      setPending((p) => {
        const next = { ...p };
        delete next[sectorName];
        return next;
      });
    } catch (err) {
      setPending((p) => ({ ...p, [sectorName]: 'error' }));
      setErrors((e) => ({ ...e, [sectorName]: err instanceof Error ? err.message : '取得に失敗しました' }));
    }
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
          「設定」からClaude APIキーを設定すると分野内の企業比較を取得できます
        </div>
      )}

      {sectors.length === 0 && (
        <p className="empty">分野がありません。上のフォームから追加してください。</p>
      )}

      {sectors.map((sectorName) => {
        const result = cache[sectorName];
        const status = pending[sectorName];
        return (
          <div key={sectorName} className="info-card">
            <div className="detail-title">
              <span className="detail-ticker"><Layers size={16} /> {sectorName}</span>
              {hasApiKey && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => fetchOne(sectorName)}
                  disabled={status === 'loading'}
                >
                  <RefreshCw size={14} className={status === 'loading' ? 'spinning' : ''} />
                  {result ? '更新' : '取得'}
                </button>
              )}
              <button className="icon-btn danger" title="分野を削除" onClick={() => removeSector(sectorName)}>
                <X size={16} />
              </button>
            </div>

            {status === 'loading' && (
              <div className="detail-loading">
                <RefreshCw size={16} className="spinning" /> AIで分析中…
              </div>
            )}

            {status === 'error' && (
              <p className="error-text">⚠ {errors[sectorName]}</p>
            )}

            {result && (
              <div className="detail-sections">
                <section className="detail-section">
                  <h3>分野全体の概況</h3>
                  <p>{result.summary}</p>
                </section>
                <section className="detail-section">
                  <h3>企業比較</h3>
                  <div className="company-compare-list">
                    {result.companies.map((c, i) => (
                      <div key={i} className="company-compare-item">
                        <div className="company-compare-head">
                          <span className="company-compare-name">{c.name}</span>
                          {c.ticker && <span className="company-compare-ticker">{c.ticker}</span>}
                          {c.held && <span className="badge badge-held">保有中</span>}
                        </div>
                        <p>{c.analysis}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {!result && !status && hasApiKey && (
              <p className="table-hint">「取得」を押すとこの分野内の企業比較が表示されます</p>
            )}

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
              </div>
            )}
          </div>
        );
      })}

      {Object.keys(cache).length > 0 && (
        <p className="detail-disclaimer">※ 分析はAIによる生成のため、最新情報は各社IRや証券会社でご確認ください</p>
      )}
    </div>
  );
}
