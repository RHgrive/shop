# PayPay 決済フロー

---

## 色分け

- **緑**：クライアント（ユーザー操作・画面）
- **青**：サイト側（フロントエンド／バックエンドのAPI呼び出し）
- **赤**：サーバー（内部処理・エラー応答）

---

## 処理手順

1. **商品選択**（緑）
2. **送金処理（取引番号入力）**（緑）
3. **API 呼び出し**（青）  
   - エンドポイント：`POST /api/paypaycheck`  
   - リクエストパラメーター：  
     - `ID`（取引番号）
     - `Price`（価格）  
       ※代行項目のみ
     - `coin`（数値）
     - `level`（数値）
     - `tnuLevelID`（配列）
     - `happinessbox`
     - `selectbox`
     - `premiumbox`
4. **レスポンス判定**（青 → 赤）  
   - **成功 (HTTP 200)**  
     - ボディに `order_id`（注文ID） を含む  
     - フロントで「代行処理画面へのリダイレクト」ボタンを表示  
     - ボタン押下で `/tsum/{order_id}` を開き、代行処理ページへ遷移（緑）
   - **失敗 (HTTP 4xx/5xx)**  
     以下のステータスコードごとに分岐し、適切なエラー処理を行う（赤 → 緑／青）

---

## エラー一覧

| ステータスコード | エラー名               | 原因・補足                   |
| ---------------- | ---------------------- | ---------------------------- |
| 500              | `DBError`              | 内部的なデータベースエラー   |
| 402              | `NotFoundHistory`      | PayPay 側に履歴が存在しない |
| 402              | `InsufficientAmount`   | ユーザーの残高不足           |
| 409              | `usedID`               | 取引番号が既に登録済み       |
| 400              | `BadRequest`           | 必須パラメーターの欠落       |

---

## 遷移イメージ

```mermaid
flowchart LR
  subgraph 緑 [クライアント]
    A[商品選択] --> B[送金（取引番号入力）]
  end

  subgraph 青 [サイト側]
    B --> C[/api/paypaycheck<br/>• ID<br/>• Price<br/>• coin<br/>…​]
    C -- YES (200) --> D[order_id: 注文ID]
    D --> E[代行処理画面へ遷移<br/>/tsum/{order_id}]
  end

  subgraph 赤 [サーバー]
    C -- NO --> F500[500<br/>DBError]
    C -- NO --> F402a[402<br/>NotFoundHistory]
    C -- NO --> F409[409<br/>usedID]
    C -- NO --> F400[400<br/>BadRequest]
    C -- NO --> F402b[402<br/>InsufficientAmount]
  end
