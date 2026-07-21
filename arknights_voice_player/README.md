# Arknights Voice Player

アークナイツの英語ボイスをオペレーター別に検索・再生する、Expo / React Native製の個人利用向けアプリです。

## 現在できること

- テスト音声の再生、一時停止、先頭へ戻る
- 380オペレーター、15,817件の英語ボイステキスト表示
- オペレーター名・ID検索
- ボイスタイトル・本文・ID検索
- 選択したボイス情報のプレイヤー反映
- バックグラウンド再生とロック画面情報表示のネイティブ設定

実際のゲーム音声はまだ配置していません。ボイス一覧の「テスト音声で再生」は、選択したメタデータをプレイヤーへ渡し、`assets/audio/test.wav`を再生します。

## 起動

```powershell
npm.cmd install
npm.cmd run web
```

## データの再生成

次の2ファイルから、React Native用の`assets/data/voice_catalog.json`を生成します。

- `../arknights_voice_text_viewer/data/processed/voice_lines.json`
- `../arknights_damage_calculator/data/processed/operators.json`

```powershell
npm.cmd run build:voice-data
```

生成時には重複ボイスIDとオペレーター名の欠損を検査します。

## 検証

```powershell
npm.cmd run lint
npm.cmd run typecheck
```

バックグラウンド再生とロック画面操作はWebやExpo Goだけでは最終確認できません。iOSのDevelopment Buildを作成した後に実機で検証します。
