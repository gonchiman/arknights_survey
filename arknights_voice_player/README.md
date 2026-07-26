# Arknights Voice Player

アークナイツの英語ボイスをオペレーター別に検索・再生する、Expo / React Native製の個人利用向けアプリです。

## 現在できること

- 音声の再生、一時停止、先頭へ戻る
- 380オペレーター、15,817件の英語ボイステキスト表示
- オペレーター名・ID検索
- ボイスタイトル・本文・ID検索
- 名前またはIDを指定して、任意のオペレーターの英語音声を取得
- ダウンロード済みの英語音声をボイスごとに再生
- バックグラウンド再生とロック画面情報表示のネイティブ設定

実音声はGit管理の対象外です。ボイス一覧に表示されるオペレーター名またはIDを指定すると、そのオペレーターのうち入手元に存在する音声だけを`public/audio/voice_en`へ保存します。

```powershell
npm.cmd run download:operator-audio -- エクシア
```

同じ名前を含む候補が複数ある場合や、名前を入力しにくい場合はIDでも指定できます。

```powershell
npm.cmd run download:operator-audio -- char_103_angel
```

アーミヤ用の従来のコマンドも引き続き使用できます。

```powershell
npm.cmd run download:amiya-audio
```

配布元にファイルがないボイスは、再生ボタンが「音声未配置」のままになります。取得済みのファイルは再ダウンロードされません。取得した音声と、保存済み音声を記録する`manifest.json`はGitHubへpushされません。

取得元は非公式の[PseudoMon/arknights-audio](https://github.com/PseudoMon/arknights-audio/tree/global-server-voices/voice_en)です。音声の権利はゲームの権利者に帰属するため、個人の動作確認に限って利用し、音声ファイルを公開・再配布しないでください。

## 起動

```powershell
npm.cmd install
npm.cmd run download:operator-audio -- エクシア
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
