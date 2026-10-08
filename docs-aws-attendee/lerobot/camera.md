# Cameraの確認

実行場所: **手元の Jetson／Mac**。[接続の確認](check.md)と [キャリブレーション](calibration.md)を済ませ、同じターミナルで進めます。

## 1. データセット収集（1回）

まず1エピソード、10秒で映像と動作を確認します。本収集と分けたテスト専用の保存先を使います。既にテストデータがある場合は、保存先の名前を変えてください。

```bash
TEST_DATASET_DIR="${LOCAL_DATASET_DIR}_camera_test"
```

=== "Jetson"

    `/dev/video0`、640×480、MJPG、30 FPS に対応するカメラの例です。検出結果が異なる場合は講師と値を合わせます。SSH で操作する場合は GUI 表示を無効にします。

    ```bash
    CAMERAS="{front: {type: opencv, index_or_path: '/dev/video0',"
    CAMERAS+=" backend: 200, width: 640, height: 480, fps: 30,"
    CAMERAS+=" fourcc: 'MJPG'}}"
    DEVICE=cuda
    DISPLAY_DATA=false
    ```

=== "Mac"

    カメラ番号 `0` の例です。検出された番号を指定し、MJPG は固定しません。デスクトップのターミナルを使います。

    ```bash
    CAMERAS='{front: {type: opencv, index_or_path: 0,'
    CAMERAS+=' width: 640, height: 480, fps: 30}}'
    DEVICE=mps
    DISPLAY_DATA=true
    ```


```bash
lerobot-record \
  --robot.type=so101_follower \
  --robot.port="$ROBOT_PORT" \
  --robot.id=my_follower_arm \
  --teleop.type=so101_leader \
  --teleop.port="$TELEOP_PORT" \
  --teleop.id=my_leader_arm \
  --robot.cameras="$CAMERAS" \
  --dataset.repo_id="$DATASET_REPO_ID" \
  --dataset.root="$TEST_DATASET_DIR" \
  --dataset.push_to_hub=false \
  --dataset.single_task="$TASK" \
  --dataset.fps=30 \
  --dataset.episode_time_s=10 \
  --dataset.reset_time_s=5 \
  --dataset.num_episodes=1 \
  --dataset.streaming_encoding=false \
  --display_data="$DISPLAY_DATA"
```

## 2.Rerunを起動

手元のデスクトップのターミナルで、テストデータを表示します。

```bash
lerobot-dataset-viz \
  --repo-id "$DATASET_REPO_ID" \
  --root "$TEST_DATASET_DIR" \
  --episode-index 0 \
  --mode local \
  --num-workers 0 \
  --batch-size 1
```

SSH のみで作業している場合は手元のデスクトップで表示します。EC2 で表示する本収集データは、[AWS へのデータ転送](../aws-transfer.md)後に DCV の Terminal から確認します。従来の Jetson 向け `192.168.55.1` を EC2 の接続先として使いません。

## 3.Testデータの削除

テストの映像と関節の記録を確認し、Rerun を閉じます。テストデータを残す必要がなければ、表示されたパスがテスト専用の場所であることを確認してから削除します。本収集の `LOCAL_DATASET_DIR` は削除しません。

```bash
printf 'テストデータの削除対象: %s\n' "$TEST_DATASET_DIR"
rm -ri -- "$TEST_DATASET_DIR"
```

削除の質問に答える前に対象を確認します。新しいターミナルでは、変数を再設定してから実行してください。

## リファレンス

- [LeRobot v0.6.0](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
- [出典と検証範囲](../verification.md)

---

[前へ: キャリブレーション](calibration.md) · [次へ: データセットの収集](collect.md)
