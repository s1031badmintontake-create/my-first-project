import type { Stock, PortfolioSummary } from './types';

export function calcGain(stock: Stock) {
  const cost = stock.purchasePrice * stock.quantity;
  const value = stock.currentPrice * stock.quantity;
  const gain = value - cost;
  const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
  return { cost, value, gain, gainPercent };
}

export function toJpy(amount: number, currency: 'JPY' | 'USD', usdJpy: number): number {
  return currency === 'USD' ? amount * usdJpy : amount;
}

export function calcPortfolioSummary(stocks: Stock[], usdJpy: number): PortfolioSummary {
  const totalCost = stocks.reduce(
    (s, st) => s + toJpy(st.purchasePrice * st.quantity, st.currency, usdJpy), 0
  );
  const totalValue = stocks.reduce(
    (s, st) => s + toJpy(st.currentPrice * st.quantity, st.currency, usdJpy), 0
  );
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  return { totalCost, totalValue, totalGain, totalGainPercent };
}

export function formatJpy(value: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrency(value: number, currency: 'JPY' | 'USD' = 'JPY'): string {
  return currency === 'USD' ? formatUsd(value) : formatJpy(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function generateId(): string {
  return crypto.randomUUID();
}
