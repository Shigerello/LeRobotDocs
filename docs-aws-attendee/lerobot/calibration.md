# キャリブレーション

実行場所: **手元の Jetson／Mac**。[接続の確認](check.md)で設定したポートを使います。機器の可動範囲を空け、停止操作ができる状態で進めます。

## 1. キャリブレーション（Leader）

既存のキャリブレーションをやり直す場合は、質問に `c` を入力し、表示された案内に従います。

```bash
lerobot-calibrate \
  --teleop.type=so101_leader \
  --teleop.port="$TELEOP_PORT" \
  --teleop.id=my_leader_arm
```

## 2. キャリブレーション（Follower）

同じく、やり直す場合は質問に `c` を入力します。

```bash
lerobot-calibrate \
  --robot.type=so101_follower \
  --robot.port="$ROBOT_PORT" \
  --robot.id=my_follower_arm
```

## 3. テレオペレーション

```bash
lerobot-teleoperate \
  --robot.type=so101_follower \
  --robot.port="$ROBOT_PORT" \
  --robot.id=my_follower_arm \
  --teleop.type=so101_leader \
  --teleop.port="$TELEOP_PORT" \
  --teleop.id=my_leader_arm
```

Follower が Leader に追従することを確認し、Ctrl+C で終了します。`my_leader_arm` と `my_follower_arm` は、同じ機器の収集・推論でも変えません。

## 4. リファレンス

- [LeRobot v0.6.0](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
- [出典と検証範囲](../verification.md)

---

[前へ: 接続の確認](check.md) · [次へ: カメラの調整](camera.md)

{% if audience == "staff" %}

## 講師：キャリブレーションの到達確認

各受講者のLeaderとFollowerのキャリブレーション完了を確認してからテレオペレーションへ進みます。

{% endif %}
