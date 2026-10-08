# データセットの編集

収集したデータセットから、失敗したエピソードを取り除きます。実行場所は **EC2 の ubuntu** です。[AWS へのデータ転送](../aws-transfer.md)で設定した `DATASET_DIR` と `DATASET_REPO_ID` を使い、元データを保った別の場所へ出力します。変更編集は今回の EC2 実測対象外です。

## 1. 準備

講師が用意した LeRobot 環境のまま作業します。従来の手元向け `pip install` は EC2 では行わず、ツールがない場合は講師に確認します。

```bash
cd ~/lerobot
export HF_HUB_OFFLINE=1
uv run --no-sync lerobot-edit-dataset --help
```

## 2. データセットの内容を確認する

### 概要を表示する

```bash
uv run --no-sync lerobot-edit-dataset \
  --repo_id "$DATASET_REPO_ID" \
  --root "$DATASET_DIR" \
  --operation.type info
```

エピソード数、フレーム数、FPS、タスクを収集時の記録と照合します。エピソード番号は0から始まります。

### エピソードごとの長さを確認する

従来と同じくメタデータの Parquet を読み、短すぎる・長すぎるエピソードを確認します。

```bash
uv run --no-sync python - "$DATASET_DIR" <<'PY'
import glob
import json

import pyarrow.parquet as pq

import sys
root = sys.argv[1]
fps = json.load(open(f"{root}/meta/info.json"))["fps"]

pattern = f"{root}/meta/episodes/chunk-*/file-*.parquet"
columns = ["episode_index", "length", "tasks"]
rows = []
for path in sorted(glob.glob(pattern)):
    rows += pq.read_table(path, columns=columns).to_pylist()
rows.sort(key=lambda r: r["episode_index"])

mean = sum(r["length"] for r in rows) / len(rows)
print("episode  frames  seconds  vs_mean  task")
for r in rows:
    seconds = r["length"] / fps
    ratio = r["length"] / mean
    task = ", ".join(r["tasks"])
    print(f"{r['episode_index']:7d}  {r['length']:6d}  "
          f"{seconds:7.1f}  {ratio:6.0%}  {task}")
PY
```

### エピソードを可視化して確認する

DCV のデスクトップ内の Terminal で表示します。

```bash
uv run --no-sync rerun "$DATASET_DIR"
```

### 確認結果を控える

失敗したエピソード番号と理由を控えます。削除後は番号が振り直されるため、元の番号との対応を残します。

## 3. エピソードを削除する

`[1, 2]` は確認した番号へ置き換えます。出力先が既にある場合は削除せず、別の名前にします。

```bash
CLEAN_DATASET_DIR="${DATASET_DIR}_clean"
export HF_HUB_OFFLINE=1
uv run --no-sync lerobot-edit-dataset \
  --repo_id "$DATASET_REPO_ID" \
  --root "$DATASET_DIR" \
  --new_repo_id "${DATASET_REPO_ID}_clean" \
  --new_root "$CLEAN_DATASET_DIR" \
  --operation.type delete_episodes \
  --operation.episode_indices '[1, 2]'
```

## 4. 結果を確認する

編集後の件数と映像を確認します。

```bash
uv run --no-sync lerobot-edit-dataset \
  --repo_id "${DATASET_REPO_ID}_clean" \
  --root "$CLEAN_DATASET_DIR" \
  --operation.type info
```
```bash
uv run --no-sync rerun "$CLEAN_DATASET_DIR"
```

## 5. 元のデータセットと差し替える

AWS 版では元データのフォルダを移動・削除せず、学習で参照する値を編集結果へ切り替えます。結果を確認できてから実行します。

```bash
DATASET_DIR="$CLEAN_DATASET_DIR"
DATASET_REPO_ID="${DATASET_REPO_ID}_clean"
```

編集しない場合はこの切替も飛ばします。共通設定は自動更新されないので、新しい Terminal では編集後の場所・識別名を設定し直します。

## 出力先の注意

`--root` は元データ、`--new_root` は別の出力先です。同じ場所を指定しません。元データと確認記録は、実習の成果を回収するまで保管します。

## エラーが出たとき

### `AssertionError: Episode length mismatch`

エピソード長の不一致や読み込みエラーが出たら変更編集を続けず、[困ったとき](../troubleshooting.md)と [データ確認](../dataset.md)を確認し、講師に元データの状態を伝えます。

## リファレンス

- [LeRobot v0.6.0](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
- [出典と検証範囲](../verification.md)

---

[前へ: AWS へのデータ転送](../aws-transfer.md) · [次へ: 学習](train.md)

{% if audience == "staff" %}

## 講師：編集結果の到達確認

削除対象を本人と確認し、元データと編集後の出力先を分けます。件数と映像を確認するまでは元データと差し替えません。

{% endif %}
