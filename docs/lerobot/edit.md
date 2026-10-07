# データセットの編集

収集したデータセットから、失敗したエピソードを取り除きます。LeRobot付属の`lerobot-edit-dataset`を使います（LeRobot 0.6.0で動作を確認）。

!!! warning
    元のデータセットは変更せず、別のディレクトリへ出力する方法を使います。`--root`と`--new_root`の指定を誤ると、結果が意図しない場所に出力されたり、元のデータセットが上書きされたりします。詳しくは「出力先の注意」を参照してください。

## 1. 準備

`lerobot-edit-dataset`が使えない場合は、`dataset`オプション付きでLeRobotを追加インストールします。

```bash
pip install 'lerobot[dataset]'
```

## 2. データセットの内容を確認する

削除の前に、どのようなエピソードがあるかを把握し、可視化して問題のあるエピソードを見つけます。ここで決めたエピソード番号を、「3. エピソードを削除する」で使います。

### 概要を表示する

```bash
cd "{{PROJECT_DIR}}"
export HF_HUB_OFFLINE=1

lerobot-edit-dataset \
  --repo_id {{DATASET_REPO_ID}} \
  --root {{DATASET_DIR}} \
  --operation.type info
```

出力例です。

```text
======Info user/mydata
Repository ID: user/mydata
Total episode: 45
Total task: 1
Total frame(Actual Count): 13482(13482)
Average frame per episode: 299.6
Average episode time(sec): 10.0
FPS: 30
Size: 568.0 MB
```

- `Total episode`は、エピソードの数です。エピソード番号は、0から`Total episode`の値より1小さい数までです。
- `Total frame(Actual Count)`は、左が記録上のフレーム数、括弧の中が実際に読み込めるフレーム数です。値が異なる場合は、データセットのメタデータに不整合があるおそれがあります。
- `Average episode time(sec)`は、1エピソードの平均の長さです。収集時に指定した`--dataset.episode_time_s`と比べる目安になります。
- `--operation.show_features=true`を付けると、カメラ名や関節名を含む特徴量も表示されます。

### エピソードごとの長さを確認する

`info`が表示するのは、全体の集計だけです。エピソードごとの長さは、次のスクリプトで一覧できます。

```python
import glob
import json

import pyarrow.parquet as pq

root = "{{DATASET_DIR}}"
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
```

出力例です。

```text
episode  frames  seconds  vs_mean  task
      0     300     10.0    102%  Pick up the red cube
      1     120      4.0     41%  Pick up the red cube
      2     298      9.9    101%  Pick up the red cube
      3     450     15.0    153%  Pick up the red cube
      4     301     10.0    102%  Pick up the red cube
```

`vs_mean`は、全エピソードの平均の長さに対する割合です。極端に短い、または長いエピソードは、途中で止まった、時間切れになったなどの可能性があるため、次の可視化で優先して確認します。

### エピソードを可視化して確認する

```bash
lerobot-dataset-viz \
  --repo-id {{DATASET_REPO_ID}} \
  --root {{DATASET_DIR}} \
  --episode-index 0 \
  --mode distant \
  --web-port 9090 \
  --grpc-port 9876 \
  --num-workers 0 \
  --batch-size 1 \
  --display-compressed-images
```

接続方法は、[カメラの調整](camera.md)の「Rerunを起動」と同じです。`--episode-index`を変えながら、1エピソードずつ確認します。Jetsonに接続したディスプレイで直接見る場合は、`--mode distant`を`--mode local`に変えます。ビューアがその場で開きます。

映像と関節の動きを見て、把持の失敗、時間切れ、環境のリセット忘れなど、学習に使いたくないエピソードを探します。

### 確認結果を控える

確認したエピソードと、その結果を控えておきます。削除すると、エピソード番号は振り直されます。控えがあれば、「4. 結果を確認する」のあとも、元のエピソードとの対応を追えます。

|エピソード|確認結果|対応|
|:--|:--|:--|
|0|問題なし|残す|
|1|把持に失敗|削除|
|2|時間切れ|削除|
|3|問題なし|残す|

## 3. エピソードを削除する

例では、上の控えのとおり、エピソード`1`と`2`を削除します。

```bash
cd "{{PROJECT_DIR}}"
export HF_HUB_OFFLINE=1

lerobot-edit-dataset \
  --repo_id {{DATASET_REPO_ID}} \
  --root {{DATASET_DIR}} \
  --new_repo_id {{DATASET_REPO_ID}}_clean \
  --new_root {{DATASET_DIR}}_clean \
  --operation.type delete_episodes \
  --operation.episode_indices "[1, 2]"
```

- `HF_HUB_OFFLINE=1`は、ローカルのデータセットだけを扱うため、Hugging Face Hubへのアクセスを無効にします。
- `--new_repo_id`と`--new_root`を指定すると、元のデータセットは変更されず、`{{DATASET_DIR}}_clean`に新しいデータセットが作られます。
- 残したエピソードを含む動画ファイルは、再エンコードされます。
- 出力先の`{{DATASET_DIR}}_clean`がすでに存在すると、`FileExistsError`で止まります。前回の結果が不要であれば削除し、必要であれば別の名前へ変更してから、もう一度実行します。

## 4. 結果を確認する

ログの最後に、削除後のエピソード数とフレーム数が表示されます。

```text
Episodes: 2, Frames: 24
```

次のコマンドでも確認できます。

```bash
python - <<'EOF'
import json
root = "{{DATASET_DIR}}_clean"
i = json.load(open(f"{root}/meta/info.json"))
print(i["total_episodes"], i["total_frames"])
EOF
```

エピソード番号は、残ったものを元の順序のまま**0から振り直します**。たとえば0〜3のうち1と2を削除すると、元の0と3は、新しいデータセットの0と1になります。`lerobot-dataset-viz`に`--root {{DATASET_DIR}}_clean`を指定すると、削除後のデータセットを再生して確認できます。

## 5. 元のデータセットと差し替える

確認できたら、元のデータセットを日時付きの名前へ退避し、削除後のデータセットを元の名前にします。

```bash
cd "{{PROJECT_DIR}}"

DATASET_DIR="{{DATASET_DIR}}"
BACKUP="${DATASET_DIR}_backup_$(date +%Y%m%d_%H%M%S)"

mv "$DATASET_DIR" "$BACKUP"
mv "${DATASET_DIR}_clean" "$DATASET_DIR"
```

退避したデータセットは、学習の結果を確認するまで残しておきます。

## 出力先の注意

!!! warning
    - `--root`だけを指定して`--new_root`を省略すると、元のディレクトリは変更されません。結果は`$HF_LEROBOT_HOME/<repo_id>`（既定では`~/.cache/huggingface/lerobot/`の下）に出力されます。
    - `--root`と`--new_root`に同じ値を指定すると、その場で上書きされます。元のデータセットは`<ディレクトリ名>_old`に退避されますが、残るのは直前の1回分だけです。続けて2回実行すると、最初のデータセットは失われます。

## エラーが出たとき

### `AssertionError: Episode length mismatch`

エピソードの長さと、動画側の長さが食い違っているときに出ます。メッセージにエピソード番号は表示されないため、次のスクリプトで食い違うエピソードを探します。

```python
import glob
import json

import pyarrow.parquet as pq

root = "{{DATASET_DIR}}"
fps = json.load(open(f"{root}/meta/info.json"))["fps"]
pattern = f"{root}/meta/episodes/chunk-*/file-*.parquet"
prefix, suffix = "videos/", "/from_timestamp"

for path in sorted(glob.glob(pattern)):
    for row in pq.read_table(path).to_pylist():
        for key in row:
            if not (key.startswith(prefix) and key.endswith(suffix)):
                continue
            camera = key[len(prefix):-len(suffix)]
            start = row[key]
            end = row[f"videos/{camera}/to_timestamp"]
            frames = round(end * fps) - round(start * fps)
            if frames != row["length"]:
                print(f"episode {row['episode_index']} ({camera}): "
                      f"length={row['length']} 動画側={frames}")
print("検査完了")
```

食い違うエピソードが見つかったら、次のどちらかで対処します。

**A. そのエピソードも削除する**

失敗したエピソードであれば、削除対象の`--operation.episode_indices`に加えて、もう一度実行します。

**B. そのエピソードを残す**

メタデータの`to_timestamp`を、`from_timestamp`と`length`から計算した値に直します。作業の前に、データセットのバックアップを作成してください。

```python
import glob
import json

import pyarrow as pa
import pyarrow.parquet as pq

root = "{{DATASET_DIR}}"
episode = 1                          # 食い違っていたエピソード番号
camera = "observation.images.front"  # 食い違っていたカメラ名

fps = json.load(open(f"{root}/meta/info.json"))["fps"]
pattern = f"{root}/meta/episodes/chunk-*/file-*.parquet"
for path in sorted(glob.glob(pattern)):
    table = pq.read_table(path)
    rows = table.to_pydict()
    if episode not in rows["episode_index"]:
        continue
    i = rows["episode_index"].index(episode)
    start = rows[f"videos/{camera}/from_timestamp"][i]
    end = start + rows["length"][i] / fps
    rows[f"videos/{camera}/to_timestamp"][i] = end
    pq.write_table(pa.table(rows, schema=table.schema), path)
```

LeRobot 0.6.0では、動画の読み出しに使われるのは`from_timestamp`だけなので、この補正で読み出し結果は変わりません。

**A、Bどちらの場合も**、エラーで止まった実行は、出力先を途中まで作っています。次のコマンドで途中の出力先だけを削除してから、「3. エピソードを削除する」をもう一度実行します。元のデータセット（`{{DATASET_DIR}}`）には影響しません。

```bash
rm -rf "{{DATASET_DIR}}_clean"
```

## リファレンス

- [LeRobot Dataset V3.0](https://huggingface.co/docs/lerobot/lerobot-dataset-v3)
- [lerobot-edit-dataset（LeRobot v0.6.0）](https://github.com/huggingface/lerobot/blob/v0.6.0/src/lerobot/scripts/lerobot_edit_dataset.py)
- [LeRobot v0.6.0 Release](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
