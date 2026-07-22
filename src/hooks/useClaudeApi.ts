import { useLocalStorage } from './useLocalStorage';

export function useClaudeApi() {
  const [apiKey, setApiKey] = useLocalStorage<string>('claudeApiKey', '');

  const callClaude = async (body: object) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `API error ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text as string;
  };

  const parseScreenshot = async (base64: string, mediaType: string) => {
    const text = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `このSBI証券アプリの保有証券スクリーンショットから全銘柄の情報を読み取ってください。
JSON配列のみを返してください（説明文は不要）。
形式: [{"ticker":"IONQ","name":"IonQ Inc","quantity":12,"currentPrice":49.31,"purchasePrice":65.74,"currency":"USD"}]
- currencyは米国株"USD"、日本株"JPY"
- 数値は文字列でなく数値型で返す`,
          },
        ],
      }],
    });
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('JSON not found in response');
    return JSON.parse(match[0]) as Array<{
      ticker: string; name: string; quantity: number;
      currentPrice: number; purchasePrice: number; currency: 'JPY' | 'USD';
    }>;
  };

  const getStockInfo = async (ticker: string, name: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const text = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1536,
      messages: [{
        role: 'user',
        content: `${ticker}（${name}）について、日本語で回答してください。本日は${today}です。半年（6ヶ月）より古い情報は含めないでください。Xの公式アカウントなどSNS上の発信も情報源として参考にして構いません。

以下の項目の順番を厳守してJSONのみ返してください（説明文は不要）:
1. 社長(CEO)コメント（最近の発言・経営方針。情報がなければ null）
2. 株価・決算・次回決算日・PER・RSI
3. トピック
4. 関連する銘柄
5. 1〜4の内容を踏まえた、株価の購入タイミングについての考察

{"ceoComment":"CEOの最近のコメント（なければnull）","stockPrice":"直近の株価水準の説明","earnings":"直近決算の概要","nextEarningsDate":"次回決算予定日","per":"PERの値と評価","rsi":"RSIの値と評価","topics":["トピック1","トピック2"],"relatedStocks":["関連銘柄1","関連銘柄2"],"buyTimingAnalysis":"購入タイミングについての考察"}`,
      }],
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON not found');
    return JSON.parse(match[0]) as {
      ceoComment: string | null;
      stockPrice: string;
      earnings: string;
      nextEarningsDate: string;
      per: string;
      rsi: string;
      topics: string[];
      relatedStocks: string[];
      buyTimingAnalysis: string;
    };
  };

  return { apiKey, setApiKey, parseScreenshot, getStockInfo };
}
