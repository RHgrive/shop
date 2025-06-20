
# TASK PROMPT FOR AI AGENT ("RHgrive/shop") – Flow Fix v1

---

## 0. 背景
* 現状 `/api/paypaycheck` は **取引 ID の真偽確認のみ**、注文登録は `/start.php` に分離されている。  
* フロー図では **1 リクエストで検証＋注文登録→order_id 返却** が必須。  
* エラー 5 種 (500 DBError / 402 NotFoundHistory / 402 InsufficientAmount / 409 usedID / 400 BadRequest) の UI ハンドリングも不足。  
* `/tsum/<order_id>` ページでは「ログインコード認証→未完了タスク一覧→タスク実行→SSE進捗」の一連 API が未完了。

---

## 1. 目標
1. **`/api/paypaycheck` だけで注文登録まで完了し `order_id` を返す** 実装に統一。  
2. 返却 `order_id` を即モーダル表示し、スクショ／コピー促し＋「代行画面を開く」ボタンを提供。  
3. サーバーから返る 5 種ステータス／エラー名を **UI に分岐表示**。  
4. `/tsum/<order_id>` でログインコード認証→未完了タスク取得→タスク実行→SSE 更新を完備。  
5. すべての fetch は `const API_BASE = "https://8883-106-160-31-181.ngrok-free.app/api"` から生成。  
6. `start.php` コールは完全に排除。  
7. コードは **コメント禁止**・既存変数／CSS カスタムプロパティを変更しない。

---

## 2. 変更対象ファイル & タスク

| File | 必須変更 |
|------|---------|
| **script.js** | ① `verifyTransaction()` を削除し、チェックアウト確定 (`confirmPurchaseButton` クリック) で **直接** `/paypaycheck` を呼ぶ。<br>② 送信 body に `ID, Price, coin, level, score, tnuLevelID[], happinessbox, selectbox, premiumbox` を含める。<br>③ HTTP 200 で `handlePaymentSuccess(data)` (data.order_id 必須)。<br>④ 400/402/409/500 は `data.error` を switch して `showNotification()` に文言を振り分け。<br>⑤ `/start.php` への fetch・`transactionVerified` ロジックを全削除。 |
| **handlePaymentSuccess()** | 引数 `response` は `{ order_id }` を前提に変更。<br>既存モーダル生成はそのまま利用。 |
| **index.html** | 取引 ID 入力欄と LINE トークン欄の順序を変更不要。`start.php` 用の hidden input や余計な説明があれば削除。 |
| **tsum.js** | ① ページロード時に `order_id` を取得し `loginCode` フォームを表示。<br>② `POST ${API_BASE}/login/verify` でコード認証→ OK なら `GET ${API_BASE}/order/<order_id>` で未完了タスクを描画。<br>③ 各ボタンで `POST ${API_BASE}/order/<order_id>/execute/<task_id>`、成功時は disabled 状態＋色変化。<br>④ SSE：`new EventSource(${API_BASE}/order/${order_id}/stream)` を再接続つきで実装。 |
| **style.css** | 追加要素があれば最小限の style を追記。 |
| **AGENTS.md** | Technical Policies → 「`/start.php` 廃止、すべて `/api/*` で統一」と明記。 |
| **Debug.txt** | “Flow Fix v1” 変更点と TODO（バックエンド側 CORS 設定など）を自動出力。 |

---

## 3. エラー文言マッピング（showNotification）

| error 名 / status | 表示タイトル | メッセージ |
|-------------------|--------------|------------|
| `DBError` / 500 | システムエラー | 内部エラーが発生しました。時間をおいて再試行してください。 |
| `NotFoundHistory` / 402 | 取引履歴なし | PayPay 側に履歴が見つかりません。 |
| `InsufficientAmount` / 402 | 残高不足 | 残高が不足しています。 |
| `usedID` / 409 | 重複取引番号 | この取引番号は既に登録済みです。 |
| `BadRequest` / 400 | 入力不足 | 必須パラメータが不足しています。 |

---

## 4. 出力ルール
1. **コメントを一切入れず**、変更・新規ファイルは **ファイル全体** を個別 ```file: <filename>``` ブロックで出力。  
2. すべての fetch URL は必ず `API_BASE` で生成。  
3. 出力の最後に **SELF-REVIEW** セクションを付け、100 点満点で自己採点 → 理由 → 改善案。  
4. 既存ロジック・変数名・CSS カスタムプロパティを勝手に改名しないこと。  

---

## 5. 参考 JSON サンプル

### 5.1 `/api/paypaycheck` 200
```json
{ "order_id": "A1B2C3D4E5F6G7H8I9J0" }

5.2 /api/paypaycheck 409

{ "error": "usedID" }

5.3 /api/order/<id> 200

{
  "tasks": [
    { "id": "coin",   "name": "コイン送金",     "done": false },
    { "id": "score",  "name": "ハイスコア登録", "done": true  }
  ]
}


⸻

6. 実装順ガイド
	1.	script.js から /start.php 依存を除去 → 新 payload に改修。
	2.	エラーマッピング switch を実装。
	3.	tsum.js：認証→一覧→execute→SSE 順に追加。
	4.	CSS 最小追記 → 動作検証 → SELF-REVIEW 記述 → 完了。

---

これを生成エンジンに渡せば、フロー図どおりの API 連携・UI 挙動を満たすコード一式が出力されます。
