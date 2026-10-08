# 推論の実行

実行場所: **手元の Jetson／Mac**。[AWS からのモデル回収](../aws-model-recovery.md)で設定した `POLICY_PATH` を使います。新しい Terminal では [接続の確認](check.md)と [カメラの調整](camera.md)の各変数も設定し直します。この AWS 連携後の実機推論は未検証です。

## 1. 推論前の安全確認

- ロボットの周囲から障害物を取り除きます。
- いつでも Ctrl+C で停止できる状態にします。
- カメラ位置、照明、物体、背景、初期姿勢を収集時に合わせます。
- 収集と同じ機器 ID、カメラ名 `front`、タスク文を使います。
- 最初は10秒だけ、録画なしで確認します。

回収した Policy の設定とモデルファイルを確認します。

```bash
test -f "$POLICY_PATH/config.json"
find "$POLICY_PATH" -maxdepth 1 -type f \
  -name '*.safetensors' -print
```

`config.json` と `.safetensors` の両方を確認できなければ進まず、実際のチェックポイントの場所を講師と確認します。

## 2. 推論動作テスト（録画なし）

従来と同じ `lerobot-rollout` を使い、手元の Jetson では `DEVICE=cuda`、Mac では `DEVICE=mps` を指定します。設定は [カメラの調整](camera.md)にあります。

```bash
cd "$PROJECT_DIR"
export HF_HUB_OFFLINE=1
lerobot-rollout \
  --strategy.type=base \
  --policy.path="$POLICY_PATH" \
  --robot.type=so101_follower \
  --robot.port="$ROBOT_PORT" \
  --robot.id=my_follower_arm \
  --robot.cameras="$CAMERAS" \
  --device="$DEVICE" \
  --fps=30 \
  --duration=10 \
  --task="$TASK" \
  --display_data="$DISPLAY_DATA" \
  --return_to_initial_position=true
```

`base` は録画しない方式なので `--dataset.*` は付けません。意図しない動きがあれば停止し、機器・カメラ・タスクとモデルの組合せを確認します。

## AWS 実習の片付け

手元の収集データ、回収したモデル、ハッシュ、実行名、結果を確認してから DCV／SSH を閉じ、[終了時の片付け](../finish.md)へ進みます。EC2 の停止・削除は講師・構築担当者へ依頼します。

## リファレンス

- [LeRobot v0.6.0](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
- [出典と検証範囲](../verification.md)

---

[前へ: AWS からのモデル回収](../aws-model-recovery.md) · [次へ: 終了時の片付け](../finish.md)
