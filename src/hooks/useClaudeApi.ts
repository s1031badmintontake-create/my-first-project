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

  const extractTrailingJson = (text: string) => {
    const start = text.lastIndexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('AIの回答からJSONを取得できませんでした。もう一度お試しください');
    }
    return JSON.parse(text.slice(start, end + 1));
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
      max_tokens: 8192,
      thinking: { type: 'disabled' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      messages: [{
        role: 'user',
        content: `${ticker}（${name}）について、Web検索ツールを使って実際に検索してください。本日は${today}です。過去1ヶ月以内（${today}の1ヶ月前以降）の情報のみを対象にしてください。それより古い情報しか見つからない場合は該当項目を空にしてください。

検索が終わったら、検索結果の要約・説明・前置きなどの文章は一切書かず、次のJSONオブジェクト1つだけを出力してください。JSON以外の文字は絶対に出力しないでください。

- ceoComment: 過去1ヶ月以内のCEO・社長の発言や経営方針コメント。見つからなければ null
- topics: 過去1ヶ月以内の具体的なトピックを2〜3件。見つからなければ空配列
- relatedStocks: 関連する銘柄のティッカーを2〜3件

出力形式:
{"ceoComment":"...","topics":["...","..."],"relatedStocks":["...","..."]}`,
      }],
    });
    return extractTrailingJson(text) as {
      ceoComment: string | null;
      topics: string[];
      relatedStocks: string[];
    };
  };

  const getCompetitiveAnalysis = async (ticker: string, name: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const text = await callClaude({
      model: 'claude-sonnet-5',
      max_tokens: 8192,
      thinking: { type: 'disabled' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      messages: [{
        role: 'user',
        content: `${ticker}（${name}）が属する業界・分野について、Web検索ツールを使って実際に検索してください。本日は${today}です。銘柄を1つに絞った比較ではなく、その分野全体の状況を踏まえて回答してください。

検索が終わったら、検索結果の要約・説明・前置きなどの文章は一切書かず、次のJSONオブジェクト1つだけを出力してください。JSON以外の文字は絶対に出力しないでください。

- field: ${ticker}が属する分野・業界名
- overview: その分野全体の概況（主なプレイヤーや市場動向など。2〜3文）
- position: ${name}のその分野内での相対的な立ち位置（強み・弱みを含めて2〜3文）

出力形式:
{"field":"...","overview":"...","position":"..."}`,
      }],
    });
    return extractTrailingJson(text) as {
      field: string;
      overview: string;
      position: string;
    };
  };

  return { apiKey, setApiKey, parseScreenshot, getStockInfo, getCompetitiveAnalysis };
}
