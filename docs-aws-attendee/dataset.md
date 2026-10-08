# 教材の取得と LeRobot のデータ確認

最初に [共通値の設定](common.md) を開き、講師から受け取った値を入力してください。認証情報ファイルのパス・期限付き URL はフォームに保存せず、各コマンドの手動置換箇所で指定します。

## 1. 手元に現行教材を取得する

**手元の PC** で講習会用の環境を有効化してから実行します。

```bash
gclue-ai-handson-attendee files pull --dest ./materials
```

`manifest.json のとおりであることを SHA-256 で確認しました。` が成功条件です。版の指定がある場合は `--version '<版>'` を追加します。

共有データセットは、講師が指定したプレフィックスを指定します。次の `datasets/` は配置例です。

```bash
gclue-ai-handson-attendee files pull --prefix datasets/ \
  --dest ./datasets
```

これは共有領域 `shared/datasets/` の取得です。現行教材取得と違い、任意の `--prefix` 取得に manifest の SHA 検証が必ず付くわけではありません。講師のチェックサム表があれば別に照合してください。

## 2. EC2 にある実習環境を確かめる

このページは、講師が LeRobot とデータセットを配置済みの EC2 を使います。受講者は構築スクリプトを実行しません。配置場所が違う場合は講師の案内に合わせてください。

[DCV](connect.md) のデスクトップから Terminal を開きます。**以降は EC2 の ubuntu ユーザー** で実行します。`~/lerobot` がない、`uv` がない場合は講師に構築状況を確認してください。

```bash
whoami
cd ~/lerobot
git rev-parse HEAD
uv --version
uv run --no-sync python --version
uv run --no-sync lerobot-edit-dataset --help
```

検証環境は Ubuntu 24.04 / x86_64、LeRobot v0.6.0（`30da8e687a6dfc617fcd94afc367ac7071c376ce`）、Python 3.12.3、uv 0.12.23 でした。`whoami` が `ubuntu`、各バージョンと help が出れば次へ進めます。`--no-sync` は構築済みの依存をそのまま使う指定です。

## 3. データセットの場所を指定する

[共通値の設定](common.md)のデータセットの場所と識別名を確認して、次を実行します。以下はシェル変数なので、このターミナル内で続けて使います。`{{DATASET_REPO_ID}}` はバケット名や EC2 名ではなく、データセットの識別名です。

```bash
DATASET_DIR={{DATASET_DIR_SH}}
DATASET_REPO_ID={{DATASET_REPO_ID_SH}}
ls "$DATASET_DIR/meta/info.json"
```

`meta/info.json` のパスが表示されれば配置確認は成功です。検証では `1cam_test` を使いましたが、本番配布する教材名・場所は講師が決めます。

手元だけにデータがある場合は、講師に EC2 への配置を依頼するか、[SSH 設定](connect.md)を作成した後、**手元**からコピーできます。この `scp` による汎用手順は今回の実測対象外です。

```bash
scp -r '<手元のデータセットフォルダ>' \
  'gclue-ai-handson-{{EVENT_ID}}:/home/ubuntu/lerobot/'
```

コピー後に EC2 で `meta/info.json` の存在を確認し、講師から受け取ったチェックサムで照合します。

## 4. データを変更せず内容を確認する

**EC2** の `~/lerobot` で実行します。

```bash
uv run --no-sync lerobot-edit-dataset \
  --repo_id "$DATASET_REPO_ID" \
  --root "$DATASET_DIR" \
  --operation.type info
```

エピソード数・フレーム数・FPS 等が表示され、講師の教材説明と一致すれば成功です。検証に使ったデータは 48 エピソード、14,538 フレーム、30 FPS でした。この数値は別の教材では変わります。

ここで使う `info` は情報表示です。エピソード削除・結合・再エンコード等の変更操作は未検証なので、この基本コースでは実行しません。

## 5. Rerun で映像を表示する

**EC2 の DCV デスクトップ内の Terminal** で、同じ変数を設定済みの状態から実行します。通常の SSH ターミナルから GUI を開こうとせず、DCV 内で操作します。

```bash
cd ~/lerobot
uv run --no-sync rerun "$DATASET_DIR"
```

Rerun のウィンドウが開き、映像や時系列データを確認できれば成功です。Rerun を閉じ、ターミナルが戻らなければ Ctrl+C で終了します。この主手順は今回の実測で使った Rerun へのデータセットディレクトリ指定に合わせています。

LeRobot の `lerobot-dataset-viz --repo-id ... --root ... --episode-index 0 --mode local` は別の CLI です。今回そのコマンドでの表示を実測済みとはしていません。講師が別途確認した場合に使ってください。

## Parquet の読み取りに失敗する場合

`Corrupt footer` などが出て、Hugging Face 等から Git で clone したデータの場合、実データの代わりに Git LFS の小さなポインタファイルだけがある可能性があります。

講師に、対象が Git LFS を使うデータセットの clone であることと、ネットワーク取得してよいことを確認します。**EC2** で対象の clone に移動して次を実行します。LeRobot 本体のディレクトリではありません。

```bash
cd "$DATASET_DIR"
git lfs version
git lfs ls-files
git lfs fetch
git lfs checkout
cd ~/lerobot
```

`git lfs` がなければ講師へ導入を依頼します。取得後に上の `info` と表示コマンドを再実行します。検証では aloha のデータ実体化後の表示が成功しました。pusht の表示成功は確認していません。

## 学習に進む前に

GPU 学習、ResNet18 重みの事前取得、編集による変更、可視化のポート転送は未検証です。依存導入や Rerun 表示の成功を GPU 学習の成功とみなさず、講師が確認した追加手順に従ってください。既存の Jetson 用 Python 3.10 手順を、この EC2 用 Python 3.12 環境へ混ぜないでください。

確認が終わったら [保存と回収](save.md) へ進みます。
