# LeRobot 実習と AWS 連携の進め方

従来の SO-101 実習（接続確認、キャリブレーション、収集、編集、学習、推論）に、今回の AWS の認証・接続・データ転送・成果回収を組み込んだ手順です。**ロボットとカメラを動かすのは手元の Jetson／Mac、GPU 学習をするのは自分用の EC2** です。

講師の配布データで学習する場合は、収集・送信の工程を飛ばして[AWS へのデータ転送](aws-transfer.md)の EC2 の確認から進めます。学習を行わない基本コースは、情報表示と Rerun 確認で実習を終え、[保存と回収](save.md)へ進んでください。

!!! note "この通し手順の確認範囲"
    AWS の接続、教材取得、データ情報表示、DCV 上の Rerun、小さなファイルの S3 往復は実測済みです。SO-101 の収集・変更編集と EC2 の GPU 学習、学習済みモデルを手元へ戻した実機推論を含む通し実行は未検証です。これらを行うコースでは、講師が同じ機器・データ・EC2 環境で確認してから進めます。[出典と検証範囲](verification.md)も参照してください。

{% if audience == "staff" %}

## 講習会側：実習前の確認

[事前準備](staff/preparation.md)で環境構築・教材公開・初回配布・講師への引き渡しを完了してから、以下の実習を開始します。

{% endif %}

## 進め方

以下の順に実習を進めます。AWS への転送とモデル回収は、データを受け渡す工程で行います。

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

コマンドに出てくる大文字の名前は、値を覚えておくための「変数」です。例えば `DATASET_DIR` にフォルダの場所を設定すると、以降のコマンドの `"$DATASET_DIR"` はその場所を使います。手元のPCとEC2は別の機器なので、変数も別々に設定します。[各種値の設定](common.md)に、入力する全項目の用途と値の決め方があります。

以下は、開催を `workshop01`、受講者を `attendee01` とした**説明用の例**です。開催・受講者・データの名前は講師が配布した値を使ってください。

| 変数名 | 意味・どこで使うか | 説明用の値 |
| --- | --- | --- |
| `LOCAL_DATASET_DIR` | 手元のJetson／Macで収集した映像と動作記録を置くフォルダ。[接続の確認](lerobot/check.md)で設定する | Macなら `/Users/student/handson-data/workshop01/attendee01/round1` |
| `DATASET_DIR` | EC2で編集・学習するデータのフォルダ。手元から送ったデータはここへ取得する。配布データなら講師の配置先を使う | `/home/ubuntu/handson-data/workshop01/attendee01/round1` |
| `DATASET_REPO_ID` | データ一組に付けるLeRobotの識別名。収集・転送後の確認・学習で同じ名前を使う | `attendee01/red-cube` |

同じデータでも、手元とEC2のフォルダの場所は異なります。編集でデータを別のフォルダへ出力した場合は、[編集の手順](lerobot/edit.md)に従ってEC2側の場所と識別名を切り替えます。

各機器の工程は同じターミナルで続けます。新しく開いたターミナルには前の変数が引き継がれないため、該当ページの設定コマンドを再実行します。ブラウザの設定フォームを変更しても、実行済みのターミナルの値は変わりません。
