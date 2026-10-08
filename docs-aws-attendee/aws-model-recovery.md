# AWS からのモデル回収

[学習](lerobot/train.md)が終了したら、EC2 → 自分専用の S3 領域 → 手元の Jetson／Mac の順にチェックポイントを戻します。


## 1. EC2 から保存する

実行場所: **EC2 の ubuntu**。前の学習で使った `RUN_NAME` と `TRAIN_OUTPUT_DIR` を使います。学習が正常に終了したことを確認してから進めます。

```bash
source /tmp/gclue-ai-handson-{{EVENT_ID}}-{{ATTENDEE_ID}}.env
S3_ROOT="s3://$GCLUE_AI_HANDSON_BUCKET"
S3_ROOT+="/$GCLUE_AI_HANDSON_ATTENDEE"
EXPORT_DIR=$(mktemp -d)
tar -czf "$EXPORT_DIR/checkpoints.tar.gz" \
  -C "$TRAIN_OUTPUT_DIR" checkpoints
sha256sum "$EXPORT_DIR/checkpoints.tar.gz"
aws s3 cp "$EXPORT_DIR/checkpoints.tar.gz" \
  "$S3_ROOT/models/$RUN_NAME/checkpoints.tar.gz"
printf '学習実行名: %s\n' "$RUN_NAME"
```

表示された学習実行名と SHA-256 を控えます。自分専用の `models/学習実行名/` に保存されます。認証切れなら更新後に保存し直します。

## 2. 手元へ取得し、内容を確認する

実行場所: **手元の Jetson／Mac**。受講者ツールを有効にし、`<学習実行名>` を EC2 で控えた値に置き換えます。

```bash
RUN_NAME='<学習実行名>'
RECOVER_DIR=$(mktemp -d)
gclue-ai-handson-attendee files pull --own \
  --prefix "models/$RUN_NAME" --dest "$RECOVER_DIR"
shasum -a 256 "$RECOVER_DIR/checkpoints.tar.gz"
```

EC2 で控えた SHA-256 と一致したら、新しいモデル保存先へ展開します。

```bash
LOCAL_MODEL_DIR="$HOME/handson-models/$RUN_NAME"
(
  set -e
  test ! -e "$LOCAL_MODEL_DIR" || {
    echo 'モデル保存先が存在します。別のパスを使ってください。' >&2
    exit 1
  }
  mkdir -p "$LOCAL_MODEL_DIR"
  tar -xzf "$RECOVER_DIR/checkpoints.tar.gz" -C "$LOCAL_MODEL_DIR"
)
POLICY_PATH="$LOCAL_MODEL_DIR/checkpoints/last/pretrained_model"
```

`checkpoints/last` がアーカイブ内の別のチェックポイントへのリンクである場合も、そのリンク先を含む `checkpoints` 全体を回収します。回収した `POLICY_PATH` を使い、[推論の実行](lerobot/run.md)でモデルファイルと機器構成を確認します。

---

[前へ: 学習](lerobot/train.md) · [次へ: 推論の実行](lerobot/run.md)

{% if audience == "staff" %}

## 講師：モデルの回収の到達確認

checkpoints全体とlastリンクが保持され、SHA-256が一致したことを確認します。手元でモデルのconfigを確認するまではEC2の削除へ進みません。

{% endif %}
