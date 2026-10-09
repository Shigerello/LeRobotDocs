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

ここで設定する値は、ロボットを接続した手元の機器で使います。以下の例は説明用で、実際の検出結果と講師の案内に置き換えます。

| コマンドでの名前 | 意味と設定方法 | 説明用の例 |
| --- | --- | --- |
| `PROJECT_DIR` | LeRobotを準備した作業フォルダ。講師に手元の配置先を確認する | Macの `/Users/student/lerobot`、Jetsonの `/home/student/lerobot` |
| `TELEOP_PORT` | 人が動かすLeaderアームのUSB接続先。上の検出結果からLeaderに対応するものを選ぶ | Jetsonの `/dev/ttyACM0`、Macの `/dev/tty.usbmodem12301` |
| `ROBOT_PORT` | Leaderに追従するFollowerアームのUSB接続先。Leaderと取り違えない | Jetsonの `/dev/ttyACM1`、Macの `/dev/tty.usbmodem12302` |
| `LOCAL_DATASET_DIR` | 手元で本収集するデータの保存フォルダ。下のコマンドが自分のホームフォルダ・開催ID・受講者IDから組み立てる | Macの `/Users/student/handson-data/workshop01/attendee01/round1` |
| `DATASET_REPO_ID` | 映像と動作記録の一組に付ける識別名。[各種値の設定](../common.md)で講師指定の値を入力する | `attendee01/red-cube` |
| `TASK` | ロボットにさせたい作業の説明文。講師の課題に合わせ、収集と推論で同じ文を使う | `Pick up the red cube`（赤い立方体を持ち上げる） |

`$HOME`は現在操作中の機器の自分のホームフォルダです。下の `+=` は、直前に設定した文字列の末尾へ続きの文字列を付け足します。`round1`は1回目の収集分を区別する名前です。新しい収集分なら`round2`など未使用の名前へ変え、転送先も合わせます。

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

前方カメラと側面カメラの2台を接続し、検出結果と実際の映像で対応を確認します。Jetson の `/dev/video0` と `/dev/video2` を使う例では、両方が640×480、MJPG、30 FPSに対応していることを確認します。

```bash
for CAMERA_PATH in /dev/video0 /dev/video2; do
  v4l2-ctl -d "$CAMERA_PATH" --list-formats-ext
  v4l2-ctl -d "$CAMERA_PATH" --get-fmt-video
  v4l2-ctl -d "$CAMERA_PATH" --get-parm
done
```

番号は接続環境で変わります。2台が別々の機器であることを確認し、同じカメラの別ノードを2台として指定しないでください。Macでも2台の検出番号と映像を確認します。次の [カメラの調整](camera.md)で、収集・推論に使うカメラ設定を用意します。

## リファレンス

- [LeRobot v0.6.0](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
- [出典と検証範囲](../verification.md)

---

[実習の進め方](../aws-workflow.md) · [次へ: キャリブレーション](calibration.md)

{% if audience == "staff" %}

## 講師：接続確認の到達確認

LeaderとFollowerのポート、2台のカメラの番号と映像を本人と確認します。複数組の機器を取り違えず、各組の対応を控えます。

{% endif %}
