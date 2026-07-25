import { useEffect, useRef, memo } from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  ticker: string;
  currency: 'JPY' | 'USD';
}

function StockChart({ ticker, currency }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const symbol = currency === 'JPY' ? `TSE:${ticker}` : ticker;

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height: 220,
      locale: 'ja',
      dateRange: '12M',
      colorTheme: 'light',
      isTransparent: false,
      autosize: true,
    });
    container.current.appendChild(script);
  }, [ticker, currency]);

  return (
    <div>
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget" />
      </div>
      <a
        className="tradingview-open-link"
        href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink size={13} /> TradingViewで開く
      </a>
    </div>
  );
}

export default memo(StockChart);
