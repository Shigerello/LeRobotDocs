# 接続の確認

従来と同じ順で、ロボットを接続した手元の Jetson／Mac を確認します。AWS の受講者環境は先に [PC の準備と更新](../setup.md)で用意し、[各種値の設定](../common.md)で開催・受講者・データセットの値を設定してください。

## 1. 接続確認

実行場所: **ロボットとカメラを接続した手元の Jetson／Mac**。EC2 の USB ポートとして指定するものではありません。

![SO-101 とカメラの接続](../assets/robot-connection.png)

指定の USB 接続先を確認します。Jetson で起動後に接続を変えて認識番号が変わった場合は、講師の案内に沿って接続を戻し、再起動後に検出し直します。

## 2. SO-101のポート確認

=== "Jetson"

    ```bash
    ls -l /dev/ttyACM* /dev/ttyUSB* 2>/dev/null || true
    lerobot-find-port
    ```

=== "MacBook"

    ```bash
    ls -l /dev/tty.usbmodem* /dev/tty.usbserial* 2>/dev/null || true
    lerobot-find-port
    ```

検出した Leader／Follower のポート、手元の LeRobot 作業場所、収集先を設定します。`<…>` は手動で置き換えます。以降の手元の実習は、このターミナルで続けて実行します。

```bash
PROJECT_DIR='<LeRobot作業ディレクトリ>'
TELEOP_PORT='<Leaderのポート>'
ROBOT_PORT='<Followerのポート>'
LOCAL_DATASET_DIR="$HOME/handson-data/{{EVENT_ID}}"
LOCAL_DATASET_DIR+="/{{ATTENDEE_ID}}/round1"
DATASET_REPO_ID={{DATASET_REPO_ID_SH}}
TASK='Pick up the red cube'
cd "$PROJECT_DIR"
```

`DATASET_REPO_ID` は手元と EC2 で共通、`LOCAL_DATASET_DIR` は手元の収集先です。共通設定の `DATASET_DIR` は EC2 の場所です。キャリブレーション・収集・推論で同じ機器 ID を使います。

## 3. カメラ確認

```bash
lerobot-find-cameras opencv
```

Jetson の `/dev/video0` を使う場合は、640×480、MJPG、30 FPS に対応していることを確認します。

```bash
v4l2-ctl -d /dev/video0 --list-formats-ext
v4l2-ctl -d /dev/video0 --get-fmt-video
v4l2-ctl -d /dev/video0 --get-parm
```

別のカメラの場合は検出結果に合わせます。次の [カメラの調整](camera.md)で、収集・推論に使うカメラ設定を用意します。

## リファレンス

- [LeRobot v0.6.0](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
- [出典と検証範囲](../verification.md)

---

[実習の進め方](../aws-workflow.md) · [次へ: キャリブレーション](calibration.md)
