import type { PortfolioSummary } from '../types';
import { formatCurrency, formatPercent } from '../utils';

interface Props {
  summary: PortfolioSummary;
}

export default function SummaryCard({ summary }: Props) {
  const isPositive = summary.totalGain >= 0;

  return (
    <div className="summary-card">
      <div className="summary-item">
        <span className="summary-label">評価額合計</span>
        <span className="summary-value">{formatCurrency(summary.totalValue)}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">取得額合計</span>
        <span className="summary-value">{formatCurrency(summary.totalCost)}</span>
      </div>
      <div className="summary-item">
        <span className="summary-label">損益</span>
        <span className={`summary-value ${isPositive ? 'gain' : 'loss'}`}>
          {formatCurrency(summary.totalGain)} ({formatPercent(summary.totalGainPercent)})
        </span>
      </div>
    </div>
  );
}
