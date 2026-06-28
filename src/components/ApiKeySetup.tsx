import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface Props {
  apiKey: string;
  onSave: (key: string) => void;
}

export default function ApiKeySetup({ apiKey, onSave }: Props) {
  const [value, setValue] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(value.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="api-key-setup">
      <h2><Key size={18} /> Claude APIキー設定</h2>
      <p className="api-desc">
        スクリーンショット読み込み・株式情報表示に使用します。<br />
        キーはこのブラウザにのみ保存され、外部には送信されません。
      </p>

      <div className="api-steps">
        <h3>取得方法</h3>
        <ol>
          <li>ブラウザで <strong>console.anthropic.com</strong> にアクセス</li>
          <li>アカウント登録 → 「API Keys」→「Create Key」</li>
          <li>表示された <code>sk-ant-...</code> を以下に貼り付け</li>
        </ol>
      </div>

      <div className="api-input-row">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="api-input"
        />
        <button className="icon-btn" onClick={() => setShow(!show)} title={show ? '隠す' : '表示'}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={!value.trim()}>
        {saved ? <><CheckCircle size={15} /> 保存しました</> : '保存'}
      </button>

      {apiKey && (
        <p className="api-saved-note">✓ APIキーが設定されています</p>
      )}
    </div>
  );
}
