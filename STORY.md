# Day090 Story — Worry Parking Lot

## Why
毎日使う小さな課題を、1ページで即解決できる形にしたかったため。

## Requirements
- Webブラウザだけで完結すること
- 1画面で主要操作が終わること
- GitHub Pagesで公開できること

## Design highlights
- Day090専用にテーマをseed固定して再生成時の見た目を安定化
- productivity用途に寄せた単機能UIで迷いを減らす
- 出力をそのまま再利用できるテキスト構造
- Family: worry_loop_parking
- Mechanic: parking_lot_place
- Input/Output: free_note_cards -> parking_map
- Audience Promise: 寝る前に扱う心配を一つに絞れる。
- Publish Hook: 心配ごと、今できる小さな行動、期限、相手を入れると、今夜の1台だけが出口に出て残りは駐車枠に置ける。
- Complexity Tier: small
- Selected components: none
- Complexity hint: Implement the locked brief with one clear hero interaction and keep the main screenshot readable.

## Trade-offs / Known issues
- ローカル保存機能は未実装
- 複雑な入力バリデーションは最小限

## Next ideas
- 履歴保存
- プリセット追加
- エクスポート形式拡張

## Social copy
Day090｜ぐるぐる考え駐車場
寝る前の考えすぎを、今できること・明日置くこと・手放すことに停めるツールです。
