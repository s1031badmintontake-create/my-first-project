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
    const textBlocks = (data.content as Array<{ type: string; text?: string }>).filter(
      (b) => b.type === 'text' && b.text
    );
    if (textBlocks.length === 0) throw new Error('応答にテキストが含まれていません');
    return textBlocks.map((b) => b.text).join('\n');
  };

  const parseScreenshot = async (base64: string, mediaType: string) => {
    const text = await callClaude({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      thinking: { type: 'disabled' },
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
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      thinking: { type: 'disabled' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
      messages: [{
        role: 'user',
        content: `${ticker}（${name}）について、Web検索ツールを使って実際に検索し、最新情報を調べたうえで日本語で回答してください。本日は${today}です。できるだけ直近6ヶ月以内の情報を優先してください（検索しても見つからない項目は、その旨がわかる内容で構いません）。Xの公式アカウントなどSNS上の発信も情報源として参考にして構いません。

検索・調査が終わったら、最後に以下の項目の順番を厳守してJSONのみを1つ返してください（それ以外の説明文は不要）:
1. 社長(CEO)コメント（最近の発言・経営方針。情報がなければ null）
2. トピック（直近の話題を具体的に2〜3件。空配列にしない）
3. 関連する銘柄

{"ceoComment":"CEOの最近のコメント（なければnull）","topics":["トピック1","トピック2"],"relatedStocks":["関連銘柄1","関連銘柄2"]}`,
      }],
    });
    const start = text.lastIndexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) throw new Error('JSON not found');
    return JSON.parse(text.slice(start, end + 1)) as {
      ceoComment: string | null;
      topics: string[];
      relatedStocks: string[];
    };
  };

  return { apiKey, setApiKey, parseScreenshot, getStockInfo };
}
