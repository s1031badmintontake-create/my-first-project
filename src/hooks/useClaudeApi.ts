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
    // Find the last "}" then walk backward counting brace depth, so a JSON
    // object containing nested objects/arrays (e.g. companies: [{...}]) is
    // bounded by its own outer braces instead of an inner one's.
    const trimmed = text.trimEnd();
    const end = trimmed.lastIndexOf('}');
    if (end === -1) throw new Error('AIの回答からJSONを取得できませんでした。もう一度お試しください');
    let depth = 0;
    let start = -1;
    for (let i = end; i >= 0; i--) {
      const ch = trimmed[i];
      if (ch === '}') depth++;
      else if (ch === '{') {
        depth--;
        if (depth === 0) { start = i; break; }
      }
    }
    if (start === -1) throw new Error('AIの回答からJSONを取得できませんでした。もう一度お試しください');
    return JSON.parse(trimmed.slice(start, end + 1));
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

  const getSectorComparison = async (
    sectorName: string,
    stocks: Array<{ ticker: string; name: string }>
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const holdingsList = stocks.map((s) => `- ${s.ticker}: ${s.name}`).join('\n');
    const text = await callClaude({
      model: 'claude-sonnet-5',
      max_tokens: 8192,
      thinking: { type: 'disabled' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
      messages: [{
        role: 'user',
        content: `「${sectorName}」という分野について、Web検索ツールを使って調べてください。本日は${today}です。

保有銘柄一覧（この中に${sectorName}分野に該当する銘柄があれば比較対象に含めてください）:
${holdingsList}

上記の保有銘柄のうち${sectorName}分野に該当するものに加えて、その分野の主要な未保有企業も含めて、分野内の企業を比較してください。

検索が終わったら、検索結果の要約・説明・前置きなどの文章は一切書かず、次のJSONオブジェクト1つだけを出力してください。JSON以外の文字は絶対に出力しないでください。

- summary: ${sectorName}分野全体の概況（主なプレイヤーや市場動向など。2〜3文）
- companies: 比較する企業の配列（3〜6社程度）。各要素は {"name":"企業名","ticker":"ティッカー（不明ならnull）","held":上記保有銘柄に含まれるならtrue、そうでなければfalse,"analysis":"その企業の強み・弱み・立ち位置（2〜3文）"}

出力形式:
{"summary":"...","companies":[{"name":"...","ticker":"...","held":true,"analysis":"..."}]}`,
      }],
    });
    return extractTrailingJson(text) as {
      summary: string;
      companies: Array<{ name: string; ticker: string | null; held: boolean; analysis: string }>;
    };
  };

  const askAboutSector = async (
    sectorName: string,
    question: string,
    stocks: Array<{ ticker: string; name: string }>
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const holdingsList = stocks.map((s) => `- ${s.ticker}: ${s.name}`).join('\n');
    return callClaude({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      thinking: { type: 'disabled' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      messages: [{
        role: 'user',
        content: `「${sectorName}」という分野について、Web検索ツールを使って調べたうえで、以下の質問に日本語で回答してください。本日は${today}です。

保有銘柄一覧（関係する場合のみ言及してください）:
${holdingsList}

質問: ${question}

回答は自由な文章で構いません。JSON形式にする必要はありません。`,
      }],
    });
  };

  return { apiKey, setApiKey, parseScreenshot, getStockInfo, getSectorComparison, askAboutSector };
}
