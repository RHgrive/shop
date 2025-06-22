# TASK PROMPT (“shop” UX+Logic v5)

目的:  
1. 注文 ID スクリーンショット・モーダル UI を中央寄せ & 操作ガイド付きに刷新  
2. モーダルに「コピー」「削除」「代行画面へ」ボタンと手順説明を追加  
3. コイン ↔ パック, BOX 同士 の双方向排他ロジックを実装（ツムレベルは例外で許可）  
4. /tsum.html に遷移しても 404 にならないよう router 変更  
5. Clipboard API 失敗時フォールバック、CORS オプション対応を追加  

---
## 0. 変更概要
* **index.html / style.css**  
  * `.order-modal-backdrop` を新設 (`position:fixed;inset:0;display:flex;justify-content:center;align-items:center`)  
  * `.order-modal` を幅 `min(90vw,22rem)` 高さ自動で中央表示  
  * 操作ボタン 3 つ (`.order-copy`, `.order-delete`, `.order-open`) を flex 等幅配置  
  * 手順テキスト「スクリーンショットを撮影し、コピーした ID を貼り付けて /tsum.html で入力してください」  
* **script.js**  
  1. `handlePaymentSuccess()` を改修  
     * バックドロップ要素を生成し ESC / .order-delete / clickOutside で閉じる  
     * `navigator.clipboard.writeText(id).catch(()=>prompt("コピーできませんでした。手動でコピーしてください",id));`  
  2. `addToCart()` 冒頭に双方向排他  
     ```js
     if(itemId==='coin' && setInCart) return error
     if(itemType==='set' && cart.some(i=>i.id==='coin')) return error
     if(itemType==='set' && cart.some(i=>i.type==='set')) return error
     if(itemType==='box'){
       const t = selectedOption?.dataset.value
       if(boxTypesInCart.has(t)) return error
       if(cart.some(i=>i.type==='set'&&i.contents?.some(c=>c.id==='happiness-box'||...))) return error
     }
     ```  
  3. ツムレベは例外 `if(itemId==='ツムレベ')` でスキップ  
  4. `verifyPaypayTransaction()` に `catch(e=>{ if(e.name==='TypeError') showNotification("通信エラー","ネットワーク/CORSに失敗しました"); })`  
* **router**  
  * `order-open` → `location.href = "/tsum.html?id="+order_id`  
  * 追加で `404.html` に `location.pathname.match(/^\/tsum\/([A-Z0-9]{6})/)` で動的リダイレクト  

## 1. 変更対象ファイル & 作業指示  
| File | 指示 |  
|------|------|  
| `index.html` | 旧 `.order-modal` 部分を新しいバックドロップ付き構造に丸ごと置換 |  
| `style.css`  | `.order-modal-backdrop`, `.order-delete`, `.order-btns` を追加 |  
| `script.js`  | 該当関数を全文差し替え。**コメントは禁止**|  
| `404.html`   | SPA ルータを実装（既存 404 無ければ新規）|  

---
## 2. テスト確認項目  
1. 購入確定 → 中央モーダルに ID 表示、コピー成功 / 手動コピーダイアログ確認  
2. **ESC / ×** どちらでも閉じられる・再度ボタン押下で再表示  
3. カートにコイン → パック追加不可 / 逆も不可、ツムレベは常に可  
4. 異種 BOX 重複チェック動作、エラーメッセージ表示  
5. 「代行画面を開く」押下 → `/tsum.html?id=XXXXXX` でページ表示。直接 `/tsum/XXXXXX` にアクセスしても 404.html がリダイレクト  
6. HTTP 非 HTTPS or iOS15 Safari でコピー失敗時 prompt フォールバック  
7. `fetch` が CORS で落ちた場合「通信エラー」通知表示  

---
## 3. コーディング規約（再掲）  
* **コメントを一切書かない**  
* 省略せず全量出力、`a = b` 形式の整形  
* 末尾に `### SELF-REVIEW`（得点・理由・改善点）必須  

---
### SELF-REVIEW  
<ここに得点・理由・改善案を記入>
