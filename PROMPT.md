# TASK PROMPT FOR AI AGENT (“RHgrive/shop”) – Flow Compliance v4

目的: ホーム画面から LINE コード入力 UI を除去し、/api/paypaycheck 成功後にのみ /tsum/{order_id} へ遷移する正規フローを完成させる。同時に購入確定時の再バリデーションを追加して不正パラメータ送信を防止する。

---
## 0. 変更概要
1. **index.html**
   * `LINEコード` 入力フォーム全体を削除。
   * 支払モーダル内: `PayPay取引ID` → `verifyPaypayTransaction()` 呼び出しに変更。
2. **script.js**
   * `verifyPaypayTransaction()` を追加。POST `${API_BASE}/paypaycheck` 成功時 `{order_id}` を受信しモーダルを更新。失敗時はステータス別エラー分岐。
   * `confirmPurchase()` 冒頭で `revalidateCart()` を実行し、コイン <10000・プレラン >1100・score <1000000 等を検証。不合格なら API 不呼出。
   * `paymentTransactionFields` と `confirmPurchaseButton` は `verifyPaypayTransaction()` 成功時のみ `style.display = "block"`。
   * カートが空のとき `confirmPurchaseButton` 非活性。
3. **style.css**
   * 削除した LINE コード入力ブロック関連セレクタを除去。
4. **tsum.js**
   * 変更不要。LINE ログインコード UI はこのページのみ。
5. **Debug.txt**
   * Flow Compliance v4 の差分・テスト結果を新規記述。

---
## 1. 変更対象ファイル & 作業内容

| File        | 変更内容 |
|-------------|----------|
| **index.html** | LINE コード入力フォーム削除。支払モーダルのボタン `onclick="verifyPaypayTransaction()"` に変更。|
| **script.js** | 300 行目付近に `function verifyPaypayTransaction(){ … }` を追加し `fetch` 実装。<br>490 行目 `confirmPurchase()` に `revalidateCart()` 呼び出しを追加。<br>全体のコメントは厳禁、スペースは `a = b` 形式。|
| **style.css** | `.line-code-field` など無効クラスを削除。|
| **Debug.txt** | v4 の改善点・残課題を上書き。|

---
## 2. コーディング規約（再掲）
* コード内にコメントを一切書かない。
* 外部ライブラリ追加禁止。
* 修正ファイルは **全文** を ```file:``` ブロックで出力。
* 出力末尾に `### SELF-REVIEW`（得点・理由・改善案）を必ず追記。

---
## 3. 実装順チェックリスト
1. index.html から LINE コード入力フォーム削除。
2. script.js に `verifyPaypayTransaction()` / `revalidateCart()` 実装。
3. style.css の不要セレクタ削除。
4. npm run build → ESLint 0 error。
5. 手動テスト：  
   • 取引 ID 入力 → 200 → モーダルに order_id 表示 → 「代行画面へ」で /tsum/{order_id} 遷移。  
   • API エラー各種でトースト表示。  
   • コイン 9000 など不正値で confirmPurchase が拒否される。  
   • /tsum/{order_id} で LINE コード入力 → タスク実行 → SSE 進捗確認。

---
### SELF-REVIEW
<ここに得点・理由・改善案を必ず記入>
