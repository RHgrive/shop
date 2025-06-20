# TASK PROMPT FOR AI AGENT (“shop” PROJECT)

あなたは **RHgrive/shop** のフロントエンドエンジニアです。以下のタスクを順に完遂してください。  
前提：現在のファイル構成は AGENT.md に記載。バックエンドは Flask で後日実装されるため、API URL とレスポンス構造だけを仮定します。

---

## 🚩 Task 1 – 支払完了後 # TASK PROMPT FOR AI AGENT (“shop” PROJECT) – v2  (2025-06-20)

---

## 0. 背景
- 前版タスクは **スマホ幅 375 px 固定** 前提だったが、クライアントより「iPad / PC も快適表示にしたい」要望が追加された。
- GitHub リポジトリには既に AGENTS.md, PROMPT.md, 各種 HTML/CSS/JS が存在。
- 既存コードへ **破壊的変更禁止**。新規スタイル / 関数は **追記** で対応すること。

---

## 1. 追加要件 (必須)
1. **マルチブレークポイント**
   - `@media (min-width: 480px)`, `768px`, `1024px` の 3 段階でレイアウトを拡張。  
   - 375 px 固定 meta は削除し、`width=device-width, initial-scale=1` に戻す。
2. **フル幅センタリング**
   - PC ≥1024 px はページ全体を `max-width: 480px` のカードとして中央配置。  
   - iPad 横向き (≥768 px) は `max-width: 600px`。
3. **モーダル改修**
   - 画面サイズに合わせて `width: clamp(320px, 90%, 480px)`。
4. **アクセシビリティ**
   - `user-scalable=no` を **削除**。  
   - すべての操作ボタンに `aria-label` を追加。
5. **キーボード操作**
   - タブ移動でフォーカスリングが表示されるように `:focus-visible` を実装 (CSS のみ)。
6. **SSE 接続安定化**
   - `tsum.js` に再接続ロジック (`EventSource` エラー発生 → 5 秒後再接続) を追記。
7. **ホーム画面の注文 ID ジャンプ**
   - 未実装の場合は必ず追加し、`Enter` キーでも送信可にする。

---

## 2. 変更対象ファイル
| File | 変更内容 |
|------|---------|
| **index.html** | `<meta name="viewport">` 修正、注文 ID フォームの `onkeyup` (Enter 対応) |
| **style.css**  | 3 ブレークポイントの追加、モーダル幅・センタリング、`:focus-visible` |
| **script.js**  | `handlePaymentSuccess` が未定義なら実装。<br>注文 ID ジャンプ `keyup` ハンドラ追加 |
| **tsum.js**    | SSE 自動再接続、ログ表示 `aria-live`、タスクボタンに `aria-label` |
| **AGENTS.md**  | “Technical Policies” 更新 ― ビューポート&レスポンシブ指針差し替え |
| **Debug.txt**  | 今回の差分と要バックエンド修正点を追記 (自動生成) |

---

## 3. コーディング規約 (再掲)
1. **コメント禁止**／クリーンスペース (`a = b`)。
2. 外部ライブラリ禁止 (Clipboard API, Fetch, EventSource は許可)。
3. 既存変数名・CSS カスタムプロパティは変更不可。  
4. 変更箇所は **ファイル丸ごと** 出力。  
5. 各ファイル後に `自己採点 / 理由 / 改善点` を必ず追記。  

---

## 注意
1. 生成コード内にコメントを入れてはいけません。  
2. タスクの順番は変更不可。  
3. 既存ロジック・変数名・CSS カスタムプロパティは**絶対に**変更しない。  
4. 外部ライブラリは使用禁止（Clipboard API, EventSource は可）。  
5. API が未実装でもフロント側は 200 想定で作り、例外は `catch` で `alert`。
