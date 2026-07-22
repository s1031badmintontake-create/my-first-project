import type { Stock } from './types';

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
