# TASK PROMPT FOR AI AGENT (“shop” PROJECT)

あなたは **RHgrive/shop** のフロントエンドエンジニアです。以下のタスクを順に完遂してください。  
前提：現在のファイル構成は AGENT.md に記載。バックエンドは Flask で後日実装されるため、API URL とレスポンス構造だけを仮定します。

---

## 🚩 Task 1 – 支払完了後 order_id 保存モーダル
* **script.js**  
  1. `handlePaymentSuccess(response)` を新規実装。`response.order_id` を受け取り下記を実行する。  
     - `localStorage.setItem("tsumshop_order_id", order_id)`  
     - モーダルを生成し `order_id` を表示。  
       * 「コピー」ボタン → `navigator.clipboard.writeText(order_id)`  
       * 「スクリーンショットを保存してください」テキストを赤字で常時点滅  
       * 「代行画面を開く」ボタン → `location.href = "/tsum/" + order_id`
* **style.css**  
  * `.order-modal` を追加。高さ 90vh・固定 bottom: 0、ガラスモーフィズム。

---

## 🚩 Task 2 – 代行操作ページ `/tsum/<order_id>`
* **新規** `tsum.html` を生成。構成：  
  - 上部：入力 `loginCode` + 送信ボタン  
  - 中央：`<ul id="taskList">` – 未完了タスクを表示  
  - SSE ログ：`<div id="log" aria-live="polite">`
* **tsum.js**  
  1. `const order_id = location.pathname.split("/").pop()`  
  2. `fetch("/api/order/" + order_id)` → `renderTasks()`  
  3. `document.getElementById("taskList").addEventListener("click", e => { … })` で各タスク実行  
  4. `const evt = new EventSource("/api/order/" + order_id + "/stream")`  
     - `evt.onmessage = appendLog`  
     - 完了したタスクは行をグレーアウト
* **index.html** に `<script src="/tsum.js" defer></script>` を条件付きロード。

---

## 🚩 Task 3 – ホームから注文 ID 直入力
* **index.html**  
  - ナビメニューに `<input id="jumpId" placeholder="注文ID">` + `<button id="jumpBtn">開く</button>`
* **script.js**  
  - `document.getElementById("jumpBtn").onclick = () => { … }`  
    * 入力値バリデーション（英数字 20–40 桁）  
    * `location.href = "/tsum/" + value`

---

## 🚩 Task 4 – UI/UX polish
* すべてのボタンに `:active` scale(0.97) エフェクト。  
* ダークモードの色調：背景 `#1a1a1a`、文字 `#fafafa`、アクセント `var(--accent, #64b5f6)`  
* モバイル Safari 16+ 最適化：  
  `<meta name="viewport" content="width=375, user-scalable=no">`

---

## ✅ Deliverables
* **index.html**, **style.css**, **script.js**, **tsum.html**, **tsum.js**（新規）の完全リストを、ファイル単位で丸ごと提示。  
* 最後に自己採点（100点満点）、理由、改善点を必ず記載。

---

## 注意
1. 生成コード内にコメントを入れてはいけません。  
2. タスクの順番は変更不可。  
3. 既存ロジック・変数名・CSS カスタムプロパティは**絶対に**変更しない。  
4. 外部ライブラリは使用禁止（Clipboard API, EventSource は可）。  
5. API が未実装でもフロント側は 200 想定で作り、例外は `catch` で `alert`。
