# AWS へのデータ転送

手元で収集したデータを、自分専用の S3 領域を経由して EC2 へ渡します。[データセットの収集](lerobot/collect.md)の後、[データセットの編集](lerobot/edit.md)または [学習](lerobot/train.md)の前に行う AWS 連携の工程です。

## 1. 収集したデータを自分用の S3 領域へ送る

実行場所: **手元の Jetson／Mac**。受講者ツールを有効にしたターミナルで実行します。S3 の `shared/` は共有教材用です。自分の収集データは自分専用の領域へ保存します。

```bash
TRANSFER_DIR=$(mktemp -d)
tar -czf "$TRANSFER_DIR/dataset.tar.gz" \
  -C "$LOCAL_DATASET_DIR" .
shasum -a 256 "$TRANSFER_DIR/dataset.tar.gz"
gclue-ai-handson-attendee files upload \
  "$TRANSFER_DIR/dataset.tar.gz" --to datasets/round1
```

表示された64桁の SHA-256 を控えます。アーカイブにはデータセットの中身を直接入れているので、展開後の場所に `meta/info.json` が来ます。`datasets/round1` はこの受講者の領域内の転送先です。次の収集分では `round2` など別の転送先を使い、取得側のパスも合わせます。


## 2. EC2 へ取得し、データと映像を確認する

### 2.1 EC2 の ubuntu ユーザーへ接続する

実行場所: **手元の PC**。初回は [接続手順](connect.md)で DCV のパスワードを設定します。

```bash
gclue-ai-handson-attendee dcv
```

トンネル用のターミナルは開いたまま、案内された URL から DCV にログインします。DCV デスクトップ内で Terminal を開き、以降の EC2 工程はそこで実行します。情報表示や学習だけなら `gclue-ai-handson-attendee ssh` でも接続できます。

### 2.2 EC2 の作業環境と認証を確認する

実行場所: **EC2 の ubuntu**。講師が LeRobot と受講者用の一時認証情報を配置済みであることが前提です。

```bash
whoami
cd ~/lerobot
uv run --no-sync python --version
uv run --no-sync lerobot-train --help
source /tmp/gclue-ai-handson-{{EVENT_ID}}-{{ATTENDEE_ID}}.env
DATASET_DIR={{DATASET_DIR_SH}}
DATASET_REPO_ID={{DATASET_REPO_ID_SH}}
S3_ROOT="s3://$GCLUE_AI_HANDSON_BUCKET"
S3_ROOT+="/$GCLUE_AI_HANDSON_ATTENDEE"
```

`whoami` が `ubuntu` であることを確認します。認証情報がない・期限切れの場合は講師に再配布を依頼します。EC2 上で依存を追加・更新せず、環境の不足は講師に確認します。

### 2.3 自分の収集データを取得する

講師の配置済みデータを使う場合は、この取得・展開を飛ばして次の情報表示へ進みます。

```bash
DOWNLOAD_DIR=$(mktemp -d)
aws s3 cp "$S3_ROOT/datasets/round1/dataset.tar.gz" \
  "$DOWNLOAD_DIR/dataset.tar.gz"
sha256sum "$DOWNLOAD_DIR/dataset.tar.gz"
```

手元で控えた SHA-256 と一致することを確認してから、**まだ存在しない取得先**へ展開します。

```bash
(
  set -e
  test ! -e "$DATASET_DIR" || {
    echo '取得先が存在します。別のパスを指定してください。' >&2
    exit 1
  }
  mkdir -p "$DATASET_DIR"
  tar -xzf "$DOWNLOAD_DIR/dataset.tar.gz" -C "$DATASET_DIR"
  test -f "$DATASET_DIR/meta/info.json"
)
```

### 2.4 情報と映像を確認する

```bash
uv run --no-sync lerobot-edit-dataset \
  --repo_id "$DATASET_REPO_ID" \
  --root "$DATASET_DIR" \
  --operation.type info
```

エピソード数、フレーム数、FPS、タスクを収集時の記録と照合します。DCV の Terminal では、次で Rerun を表示します。

```bash
uv run --no-sync rerun "$DATASET_DIR"
```

失敗したエピソード番号を控えます。配布データが Git LFS のポインタのままの場合は、[データ確認](dataset.md)の復旧手順を使います。


---

[前へ: データセットの収集](lerobot/collect.md) · [次へ: データセットの編集](lerobot/edit.md)

{% if audience == "staff" %}

## 講師：AWSへの転送の到達確認

本人のS3 prefix・EC2を確認し、SHA-256と展開先、情報表示と映像確認を記録します。認証切れは再発行してPCとEC2それぞれで読み込み直します。

{% endif %}
