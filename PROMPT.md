以下は プロ品質 でまとめた「Flow Compliance v3 – getLink.php 廃止 & PayPay 直リンク埋め込み」用 PROMPT.md です。
これをリポジトリに置き、生成エンジン（GPT-4 / Codex など）にそのまま渡せば 1 〜 5 の修正が一括反映されます。

# TASK PROMPT FOR AI AGENT (“RHgrive/shop”) – Flow Compliance v3
**目的**: `getLink.php` を完全排除し、PayPay P2P 固定リンクを用いた決済手順に切替えると同時に、残っていた細部 5 点を仕上げる。

---

## 0. 変更概要
1. **PayPay 直リンク**  
   * `generatePaymentLink()` を削除。  
   * JS 冒頭に  
     ```js
     const FIXED_PAYPAY_URL = "https://qr.paypay.ne.jp/p2p01_diJqPHre1YDTtzKA";
     ```  
   * 「PayPayで支払う」ボタン (`paymentButton`) は **即 `window.open(FIXED_PAYPAY_URL)`**。
2. **PHP エンドポイント完全廃止** (`getLink.php` の残骸削除)  
3. **アクセストークン API パス統一**  
   * `POST ${API_BASE}/line/getaccesstoken` に変更。  
4. **エラー受信仕様の強化**  
   * サーバーは必ず `{ error:"BadRequest" }` 形式で返す前提。  
   * 未知値は `"Unknown"` としてハンドリング。  
5. **UX & アクセシビリティ調整**  
   * モーダルは **Esc** キーで閉じる。  
   * `.order-copy` ボタンに `aria-label="注文IDをコピー"`。  
   * `loginCode` 入力で Enter キーを押すと `loginBtn.click()`。  

---

## 1. 変更対象ファイル & 作業内容

| File | 変更内容 |
|------|---------|
| **script.js** | - 先頭に `const FIXED_PAYPAY_URL = "https://qr.paypay.ne.jp/p2p01_diJqPHre1YDTtzKA"`<br>- `generatePaymentLink()` とその呼び出しを削除<br>- `paymentButton.onclick = () => { window.open(FIXED_PAYPAY_URL, "_blank") }`<br>- `fetch(API_BASE+"/getaccesstoken")` → `fetch(API_BASE+"/line/getaccesstoken")`<br>- `switch(res.data.error)` に `default:"Unknown"` ケース追加<br>- `document.addEventListener("keydown",e=>{if(e.key==="Escape"){const m=document.querySelector(".order-modal");if(m)m.remove()}})` |
| **tsum.js** | `loginCode.addEventListener("keyup",e=>{if(e.key==="Enter")loginBtn.click()})` を追記 |
| **index.html / tsum.html** | 「PayPayで支払う」ボタンの SVG / ラベルはそのまま、onclick 動作は JS 側で制御 |
| **AGENTS.md** | Technical Policies: 「PayPayリンクは FIXED\_PAYPAY\_URL にハードコード」「PHP エンドポイント禁止」 |
| **Debug.txt** | Flow Compliance v3 追記 |

---

## 2. コーディング規約（再掲）
* **コメント一切禁止**、`a = b` のクリーンスペース。  
* 外部ライブラリ追加禁止。  
* 既存変数・CSS カスタムプロパティ改名不可。  
* 変更したファイルは **全文** を ` ```file:<name> ``` … ` ブロックで出力。  
* 出力末尾に `### SELF-REVIEW`（得点・理由・改善案）。

---

## 3. 参考パッチ（script.js 抜粋）

```diff
- function generatePaymentLink(amount){ ... }   // まるごと削除
+ const FIXED_PAYPAY_URL = "https://qr.paypay.ne.jp/p2p01_diJqPHre1YDTtzKA";

+ paymentButton.onclick = () => {
+   window.open(FIXED_PAYPAY_URL, "_blank");
+   showNotification("情報","PayPayの支払い画面が開きました。支払い完了後、取引IDを入力してください。");
+ };

- fetch(`${API_BASE}/getaccesstoken`,{ ... })
+ fetch(`${API_BASE}/line/getaccesstoken`,{ ... })

  switch(res.data.error){
+   case "Unknown":
+     message = "不明なエラーが発生しました。";
+     break;
  }

+ document.addEventListener("keydown",e=>{
+   if(e.key==="Escape"){
+     const m=document.querySelector(".order-modal");
+     if(m)m.remove();
+   }
+ })


⸻

4. 実装順チェックリスト
	1.	script.js 編集 → fixed URL 導入 → generatePaymentLink 削除
	2.	index.html の paymentButton は data-action 不要になったか確認
	3.	tsum.js Enter キーバインド 追加
	4.	npm run build / vite dev 等で Lint → ESLint エラー 0
	5.	手動テスト：
	•	「PayPayで支払う」 ⇒ 新タブで固定リンク
	•	取引 ID 入力→ /paypaycheck 200 → モーダル → Esc 閉じ
	•	/tsum/<id> で Enter によるログイン
	•	すべての fetch URL が ngrok-free.app/api であることを DevTools Network で確認

⸻

SELF-REVIEW

<ここに得点・理由・改善案を必ず記入>

---

この **PROMPT.md** を採用すれば、ご要望の 1 〜 5 を「壊さず」「短縮せず」「本番品質」で反映できます。
