# TASK PROMPT FOR AI AGENT (“RHgrive/shop”) – v4 (2025-06-20)

---

## 0. 追加・修正要件

1. **API ベース URL を完全固定**  
   `const API_BASE = "https://8883-106-160-31-181.ngrok-free.app/api";`  
   すべての fetch 呼び出しを `${API_BASE}/…` 形式へ。
2. **決済完了フロー強化**  
   * `POST ${API_BASE}/paypaycheck` → 200 `{ order_id }` 受信で  
     - モーダルに注文 ID を大文字等幅フォントで表示  
     - 「コピー」「スクリーンショットを保存してください（点滅赤文字）」  
     - 「代行画面を開く」ボタン → `location.href = "/tsum/" + order_id`  
     - `localStorage.setItem("tsumshop_order_id", order_id)`
3. **ホームの注文 ID ジャンプ**  
   * ナビに `<input id="jumpId">` + `<button id="jumpBtn">開く`>  
   * `Enter` キー対応
4. **/tsum/<order_id>**  
   * 最上部にログインコード入力 → `POST ${API_BASE}/login/verify`  
   * 成功後 `GET ${API_BASE}/order/<order_id>` でタスク一覧  
   * ボタンで `POST ${API_BASE}/order/<order_id>/execute/<task_id>`  
   * SSE `${API_BASE}/order/<order_id>/stream`（5 s 再接続）
5. **レスポンシブ**  
   * `<meta name="viewport" content="width=device-width, initial-scale=1">`  
   * `@media 480px / 768px / 1024px` で中央カラムを拡張  
   * `.order-modal { width: clamp(320px, 90%, 480px); }`
6. **アクセシビリティ & UX**  
   * `user-scalable=no` 削除、全ボタンに `aria-label`  
   * `:focus-visible` アウトライン、`:active` scale(.97)
7. **PHP 完全排除** (該当ファイル削除済みだが再確認)
8. **ドキュメント更新**  
   * `AGENTS.md` Technical Policies を本要件に合わせて修正  
   * `Debug.txt` に今回変更点＋バックエンド TODO を自動生成

---

## 1. 変更ファイルと実装指示

| File | 変更内容概要 |
|------|--------------|
| **index.html** | viewport 修正・ジャンプフォーム追加 |
| **style.css**  | ブレークポイント・モーダル幅・フォーカスリング |
| **script.js**  | `API_BASE` 追加、`handlePaymentSuccess` 実装、ジャンプ処理 |
| **tsum.js**    | `API_BASE` 追加、認証/実行 fetch 修正、SSE 基地 URL |
| **tsum.html**  | ログインコード UI 拡充、アクセシビリティ属性 |
| **AGENTS.md**  | Technical Policies を v4 に更新 |
| **PROMPT.md**  | (本ファイル) |
| **Debug.txt**  | 差分・要検証点を出力 |

---

## 2. コーディング規約

1. **コメント禁止**、クリーンスペース (`a = b`)。  
2. 外部ライブラリ禁止（Clipboard API・EventSource は可）。  
3. 既存変数名・CSS カスタムプロパティは変更不可。  
4. 変更・新規ファイルは **丸ごと全文** を code-block で出力。  
5. 各ファイル末尾に `自己採点 / 理由 / 改善案` を必ず付記。  

---

## 3. 出力フォーマット

````plaintext
```file: <filename>
<完全なファイル内容>
```endfile

...（ファイルごとに繰り返し）

### SELF-REVIEW
<得点 (0-100)>
<理由>
<改善案>
