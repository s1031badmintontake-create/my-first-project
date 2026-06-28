import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useExchangeRate() {
  const [rate, setRate] = useLocalStorage<number>('usdJpyRate', 150);
  const [loading, setLoading] = useState(false);

  const fetchRate = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data.result === 'success' && data.rates?.JPY) {
        setRate(Math.round(data.rates.JPY * 100) / 100);
      }
    } catch {
      // keep existing rate
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRate(); }, []);

  return { rate, setRate, fetchRate, loading };
}
