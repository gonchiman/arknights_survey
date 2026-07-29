# Arknights Voice Player

アークナイツの英語ボイスをオペレーター別に検索・再生する、Expo / React Native製の個人利用向けアプリです。

## 現在できること

- 音声の再生、一時停止、先頭へ戻る
- 380オペレーター、15,817件の英語ボイステキスト表示
- オペレーター名・ID検索
- レアリティ（星1〜6）によるオペレーター絞り込み
- 職業（先鋒・前衛・重装・狙撃・術師・医療・補助・特殊）によるオペレーター絞り込み
- ボイスタイトル・本文・ID検索
- プレイリストの作成、名称変更、削除
- プレイリストへのボイス追加、並べ替え、削除
- プレイリストの連続再生と前後移動
- プレイリストの端末内保存
- 名前またはIDを指定して、任意のオペレーターの英語音声を取得
- レアリティを指定して、該当オペレーター全員の英語音声を一括取得
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

星6オペレーター全員の音声は、次のコマンドで一括取得できます。

```powershell
npm.cmd run download:rarity-audio -- 6
```

対象件数だけを確認し、音声をまだ取得しない場合は`--dry-run`を付けます。

```powershell
npm.cmd run download:rarity-audio -- 6 --dry-run
```

アーミヤ用の従来のコマンドも引き続き使用できます。

```powershell
npm.cmd run download:amiya-audio
```

配布元にファイルがないボイスは、再生ボタンが「音声未配置」のままになります。取得済みのファイルは再ダウンロードされません。取得した音声と、保存済み音声を記録する`manifest.json`はGitHubへpushされません。

取得元は非公式の[PseudoMon/arknights-audio](https://github.com/PseudoMon/arknights-audio/tree/global-server-voices/voice_en)です。音声の権利はゲームの権利者に帰属するため、個人の動作確認に限って利用し、音声ファイルを公開・再配布しないでください。

## プレイリスト

1. 「プレイリスト」画面で名前を入力して作成します。
2. 「ボイス」画面でオペレーターを開き、追加先プレイリストを選びます。
3. 各ボイスの「プレイリストに追加」を押します。
4. 「プレイリスト」画面で順番を整え、「先頭から連続再生」を押します。

作成したプレイリストと登録順はAsyncStorageへ保存されるため、ページやアプリを閉じても同じ端末・ブラウザでは保持されます。音声ファイルを削除した場合、そのボイスはプレイリストに残りますが「音声未配置」となり、連続再生では自動的に除外されます。

## 起動

```powershell
npm.cmd install
npm.cmd run download:rarity-audio -- 6
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
