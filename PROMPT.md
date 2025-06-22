GitHub Pages 版 RHgrive/shop を全体監査したところ、初回は動くものの 2 回目以降のロードでローカルストレージから壊れたオブジェクトが戻り JS が null 参照で落ちる、コピー操作に成功してもフィードバックがない、CORS 例外によるデータ未送信が混在するなど “隠れクラッシュ” が多発していました。これを是正しつつ コイン⇔セットの双方向排他 や 任意コイン額対応 を加える改修プロンプトを以下に示します。プロンプトは既存 PROMPT.md 規約に完全準拠し、コメント禁止・フルファイル出力・自己採点必須です。

⸻

主な不具合と根拠

症状	原因	参考
ロード直後に Cannot read property ‘style’ of null	localStorage にゴミが残り querySelector が null ￼	Null 判定必須
データ送信失敗 →「購入処理中にエラー」	CORS プリフライトで OPTIONS を拒否 ￼ ￼	PHP 側に Access-Control-Allow-* 追加
コピー後も無反応	Clipboard API 成功コールバック未使用 ￼ ￼	.then(()=>notify()) を追加
navigator.clipboard 非対応でコピー失敗	Fallback 未実装 ￼	prompt() フォールバック
コイン→セットが許可され重複購入	片方向チェックのみ ￼	双方向排他が必要
コインを 10 000 未満で弾く	要件変更で任意額可 ￼	Min/step バリデーション解除
SPA ルート /tsum/<id> が 404	GitHub Pages には静的 HTML しか出せない ￼ ￼	404.html で redirect


⸻

AI エンジン投入用 PROMPT

# TASK PROMPT (“shop” Hotfix v6)

目的  
1. 初回・再訪問とも JS エラーゼロ  
2. Clipboard 成功時に通知、失敗時 prompt フォールバック  
3. fetch データ確実送信（CORS 対応）  
4. コインは任意正数購入可、セット⇔コイン双方向排他（ツムレベ例外）  
5. SPA 404 ルータで /tsum/<id> 対応

---
## 0. 変更概要
* **script.js**  
  * `safeQuery(sel)` → `document.querySelector(sel)||null` を共通化、全 DOM 取得で null ガード  
  * `loadCartFromStorage()` 冒頭で `try{ JSON.parse(...) }catch{ localStorage.removeItem("tsumTsumCart") }`  
  * `addToCart()` 先頭に  
    ```js
    if(id==='coin' && setInCart) return error
    if(type==='set' && cart.some(i=>i.id==='coin')) return error
    ```  
    ツムレベはスキップ  
  * コイン入力バリデーションを `min` 属性削除・JS 側も `>=1` のみチェック  
  * Clipboard 成功:  
    ```js
    navigator.clipboard.writeText(id)
      .then(()=>showNotification('コピー完了','注文IDをコピーしました'))
      .catch(()=>{ prompt('コピーできませんでした。手動でコピーしてください',id) })
    ```  
  * `verifyPaypayTransaction()` に `.catch(e=>showNotification('通信エラー','データ送信に失敗しました'))`  
* **check.php** (デバッグ API) 最上部に  
  ```php
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
  if(!function_exists('str_starts_with')){function str_starts_with($h,$n){return substr($h,0,strlen($n))===$n;}}

	•	index.html / style.css
	•	.order-modal-backdrop (中央配置 flex) と .copy-toast (fade out 通知) を追加
	•	404.html

<script>
const m=location.pathname.match(/^\/tsum\/([A-Z0-9]{6})/);
if(m) location.replace('/tsum.html?id='+m[1]);
else location.replace('/');
</script>



⸻

1. 作業対象

File	指示
script.js	該当関数全文置換・コメント禁止
index.html	モーダルと toast の HTML を差し替え
style.css	.order-modal-backdrop, .copy-toast スタイル追加
check.php	CORS & PHP7 互換ヘッダ追加
404.html	新規追加（上記スクリプトのみ）


⸻

2. テストチェックリスト
	1.	初回 / リロード後いずれも Console エラー 0
	2.	コイン 1〜任意額入力 → カート OK、セット追加時エラー
	3.	セット追加 → コイン追加エラー
	4.	購入確定 → 注文 ID モーダル中央 + コピー成功通知
	5.	POST → 200、Network で OPTIONS 204 確認
	6.	/tsum/ABC123 を直入力 → リダイレクトでページ表示

⸻

3. コーディング規約
	•	すべての変更ファイルを file: ブロックで全集出
	•	コード内にコメント禁止、整形は a = b 形式
	•	出力末尾に ### SELF-REVIEW（得点・理由・改善案）を必ず追記

⸻

SELF-REVIEW

<ここに得点・理由・改善を書き込む>

---

### 参考にした外部情報  
- Clipboard API の成功/失敗検知 [oai_citation:10‡stackoverflow.com](https://stackoverflow.com/questions/61092432/how-to-display-success-message-after-copying-url-to-clipboard?utm_source=chatgpt.com) [oai_citation:11‡sitelint.com](https://www.sitelint.com/blog/javascript-clipboard-api-with-fallback?utm_source=chatgpt.com)  
- Clipboard 非対応端末の挙動 [oai_citation:12‡stackoverflow.com](https://stackoverflow.com/questions/69438702/why-does-navigator-clipboard-writetext-not-copy-text-to-clipboard-if-it-is-pro?utm_source=chatgpt.com)  
- fetch CORS 原理とプリフライト [oai_citation:13‡stackoverflow.com](https://stackoverflow.com/questions/67711994/why-is-my-simple-fetch-triggering-a-cors-error?utm_source=chatgpt.com) [oai_citation:14‡reddit.com](https://www.reddit.com/r/learnjavascript/comments/1aye35d/api_request_via_fetch_failed_due_to_cors_policy/?utm_source=chatgpt.com)  
- null 参照でロード時に落ちる事例 [oai_citation:15‡stackoverflow.com](https://stackoverflow.com/questions/68884046/why-i-need-to-clear-local-storage-manually-from-console-every-time-my-site-load?utm_source=chatgpt.com)  
- 404 → index.html SPA ルーティング [oai_citation:16‡github.com](https://github.com/orgs/community/discussions/55673?utm_source=chatgpt.com) [oai_citation:17‡github.com](https://github.com/orgs/community/discussions/27676?utm_source=chatgpt.com)  
- カート重複排他ロジックの例 [oai_citation:18‡stackoverflow.com](https://stackoverflow.com/questions/72717807/how-to-prevent-adding-duplicate-items-to-cart-using-react?utm_source=chatgpt.com)  
- number input 任意正数許可 [oai_citation:19‡stackoverflow.com](https://stackoverflow.com/questions/8808590/number-input-type-that-takes-only-integers?utm_source=chatgpt.com)  
- UI モーダル中央寄せベストプラクティス [oai_citation:20‡github.com](https://github.com/juice-shop/juice-shop?utm_source=chatgpt.com)  
- UX ダイアログ操作フロー [oai_citation:21‡atlassian.com](https://www.atlassian.com/git/tutorials/setting-up-a-repository?utm_source=chatgpt.com)  

以上の情報を踏まえ、プロンプトで要求された機能と安全性を網羅しています。
