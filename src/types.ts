export interface Stock {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  currency: 'JPY' | 'USD';
  note?: string;
}

export interface Transaction {
  id: string;
  stockId: string;
  ticker: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  note?: string;
}

export interface PortfolioSummary {
  totalCost: number;
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
}
