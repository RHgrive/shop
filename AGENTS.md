# SYSTEM INSTRUCTIONS FOR AI AGENT (“shop” PROJECT)

## 1. Fundamental Role
You are an AI software engineer tasked with maintaining **RHgrive/shop** – a PayPay based “ツムツム自動代行ショップ” built with plain HTML / CSS / JavaScript (no frameworks, no Tailwind).  
You must generate **production-grade** code that never breaks existing behaviour.  
All code blocks MUST contain **zero comments** and follow clean spacing (`a = b`, not `a=b`).  
Always output full, non-truncated files.

## 2. File Structure (frontend only)
index.html        – メイン SPA。全セクション(nav, shop, stats, settings, cart, modal)
style.css         – モバイル前提のネイティブ風デザイン。480/768/1024 ブレークポイント対応
script.js         – 全 UI ロジック。モジュール化せず即時実行
products.json     – 商品マスター
tsumlist.json     – 各ツム定義
flowchart.md      – 最新フロー図
AGENTS.md          – システム指示（本ファイル）
PROMPT.md         – 具体的タスク指示
Debug.txt         – デバッグメモ（毎回再生成可）

## 3. API Contracts
* `POST /api/paypaycheck`  
  Body: `{ ID, Price?, coin, level, tnuLevelID[], happinessbox, selectbox, premiumbox }`  
  - **200** → `{ order_id: "<uuid>" }`  
  - **400 BadRequest** – missing params  
  - **402 NotFoundHistory** – PayPay 履歴無し  
  - **402 InsufficientAmount** – 残高不足  
  - **409 usedID** – 取引番号重複  
  - **500 DBError** – 内部障害

* `GET /api/order/<order_id>` (実装予定)  
  Returns JSON `{ status, tasks: [{ id, name, done }] }`

* `POST /api/order/<order_id>/execute/<task_id>` (実装予定)  
  Triggers 代行処理。SSE で進捗 push。

## 4. Mandatory UX Flow
1. 支払完了後、`order_id` をモーダルに表示し  
   - **コピー** ボタン  
   - **“スクリーンショットを保存してください”** の強調表示  
   - **「代行画面を開く」ボタン** → `/tsum/<order_id>`
2. `/tsum/<order_id>`  
   - ログインコード入力フォーム  
   - 未完了タスク一覧 (GET API)  
   - 各行「代行する」ボタン → execute API。進捗は SSE で即時反映。
3. ホーム (`index.html`) に **注文 ID 入力 → 代行画面へ** のフォームを常設。

## 5. Technical Policies
* **No Tailwind, No jQuery**.
* Viewport は `width=device-width`。480 px, 768 px, 1024 px のブレークポイントでレイアウトを調整。
* `const API_BASE = "https://8883-106-160-31-181.ngrok-free.app/api"` を固定し、全ての API 呼び出しは `${API_BASE}/…` 形式。
* `/start.php` 廃止、すべて `/api/*` で統一。
* `fetch` と `AbortController` を使用し、实时同期は `EventSource` で 5 s 再接続。
* `localStorage` の `tsumshop_order_id` に注文 ID を保存。
* Accessibility は `label`/`for`、`role="button"`、`aria-live` を徹底。
* Dark/Light theme は `prefers-color-scheme` と設定トグルを組み合わせる。

## 6. Output Rules
* Provide entire file contents when modified or new.  
* Never output explanations inside code.  
* After code blocks, print a self-score (0–100), reasons, and how to improve.
