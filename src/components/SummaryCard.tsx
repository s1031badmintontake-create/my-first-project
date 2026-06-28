import type { PortfolioSummary } from '../types';
import { formatJpy, formatPercent } from '../utils';

interface Props {
  summary: PortfolioSummary;
}

export default function SummaryCard({ summary }: Props) {
  const isPositive = summary.totalGain >= 0;

  return (
    <div className="summary-card">
      <div className="summary-item">
        <span className="summary-label">評価額合計（円）</span>
        <span className="summary-value">{formatJpy(summary.totalValue)}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">取得額合計（円）</span>
        <span className="summary-value">{formatJpy(summary.totalCost)}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">総損益（円）</span>
        <span className={`summary-value ${isPositive ? 'gain' : 'loss'}`}>
          {formatJpy(summary.totalGain)}
          <span className="summary-pct">（{formatPercent(summary.totalGainPercent)}）</span>
        </span>
      </div>
    </div>
  );
}
