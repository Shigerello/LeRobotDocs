# LeRobot 実習と AWS 連携の進め方

従来の SO-101 実習（接続確認、キャリブレーション、収集、編集、学習、推論）に、今回の AWS の認証・接続・データ転送・成果回収を組み込んだ手順です。**ロボットとカメラを動かすのは手元の Jetson／Mac、GPU 学習をするのは自分用の EC2** です。

講師の配布データで学習する場合は、収集・送信の工程を飛ばして[AWS へのデータ転送](aws-transfer.md)の EC2 の確認から進めます。学習を行わない基本コースは、情報表示と Rerun 確認で実習を終え、[保存と回収](save.md)へ進んでください。

!!! note "この通し手順の確認範囲"
    AWS の接続、教材取得、データ情報表示、DCV 上の Rerun、小さなファイルの S3 往復は実測済みです。SO-101 の収集・変更編集と EC2 の GPU 学習、学習済みモデルを手元へ戻した実機推論を含む通し実行は未検証です。これらを行うコースでは、講師が同じ機器・データ・EC2 環境で確認してから進めます。[出典と検証範囲](verification.md)も参照してください。

## 進め方

従来と同じページ分け・章番号で LeRobot の実習を進めます。AWS 連携を追加した工程は、実習の前後とデータを受け渡す位置に案内しています。

| 順番 | ページ | 実行場所 |
| --- | --- | --- |
| 準備 | [各種値の設定](common.md)、[PC の準備と更新](setup.md) | 手元 |
| 1 | [接続の確認](lerobot/check.md) | 手元の Jetson／Mac |
| 2 | [キャリブレーション](lerobot/calibration.md) | 手元の Jetson／Mac |
| 3 | [カメラの調整](lerobot/camera.md) | 手元の Jetson／Mac |
| 4 | [データセットの収集](lerobot/collect.md) | 手元の Jetson／Mac |
| AWS | [AWS へのデータ転送](aws-transfer.md) | 手元 → S3 → EC2 |
| 5 | [データセットの編集](lerobot/edit.md) | EC2 の ubuntu |
| 6 | [学習](lerobot/train.md) | EC2 の ubuntu |
| AWS | [AWS からのモデル回収](aws-model-recovery.md) | EC2 → S3 → 手元 |
| 7 | [推論の実行](lerobot/run.md) | 手元の Jetson／Mac |
| 終了 | [保存と回収](save.md)、[終了時の片付け](finish.md) | 手元 |

## 実行場所と値の使い分け

ロボット・カメラの操作は手元、GPU 学習は自分用の EC2 です。手元の USB ポートやカメラは EC2 に自動接続されません。

`LOCAL_DATASET_DIR` は手元の収集先、共通設定の `DATASET_DIR` は EC2 のデータの場所です。`DATASET_REPO_ID` は両方で同じ識別名を使います。各機器の工程は同じターミナルで続け、新しく開いた場合は該当ページの変数を設定し直します。

## この構成の出典

従来の `docs/lerobot/check.md`、`calibration.md`、`camera.md`、`collect.md`、`edit.md`、`train.md`、`run.md` のページ分けと章立てを基にしています。AWS 版で変わる実行場所、認証、転送、成果回収を組み込みました。[出典と検証範囲](verification.md)で実測の範囲を確認できます。
