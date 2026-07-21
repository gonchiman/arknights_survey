# Arknights Voice Player

アークナイツの英語ボイスをオペレーター別に検索・再生する、Expo / React Native製の個人利用向けアプリです。

## 現在できること

- 音声の再生、一時停止、先頭へ戻る
- 380オペレーター、15,817件の英語ボイステキスト表示
- オペレーター名・ID検索
- ボイスタイトル・本文・ID検索
- アーミヤの「Appointed as Assistant（CN_001）」の英語音声再生
- バックグラウンド再生とロック画面情報表示のネイティブ設定

現在、実音声に対応しているのはアーミヤの`CN_001`だけです。ほかのボイスの再生ボタンは、対応する音声ファイルを追加するまで無効になります。

実音声はGit管理の対象外です。各自のPCで、次の場所に配置してください。

```text
assets/audio/voice_en/char_002_amiya/CN_001.mp3
```

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
