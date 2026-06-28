import type { Stock, PortfolioSummary } from './types';

export function calcGain(stock: Stock) {
  const cost = stock.purchasePrice * stock.quantity;
  const value = stock.currentPrice * stock.quantity;
  const gain = value - cost;
  const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
  return { cost, value, gain, gainPercent };
}

export function calcPortfolioSummary(stocks: Stock[]): PortfolioSummary {
  const totalCost = stocks.reduce((s, st) => s + st.purchasePrice * st.quantity, 0);
  const totalValue = stocks.reduce((s, st) => s + st.currentPrice * st.quantity, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  return { totalCost, totalValue, totalGain, totalGainPercent };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function generateId(): string {
  return crypto.randomUUID();
}
