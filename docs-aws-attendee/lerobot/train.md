# 学習

実行場所: **EC2 の ubuntu**。[AWS へのデータ転送](../aws-transfer.md)、必要なら [データセットの編集](edit.md)を済ませた同じ Terminal で進めます。講師が CUDA と GPU 計算、ACT の ResNet18 重みのキャッシュを確認済みであることが前提です。今回の EC2 の GPU 学習は未検証です。

## 1. ACT学習（新規）

Jetson 用のメモリ設定や Mac の `mps` を EC2 へそのまま移しません。GPU と PyTorch を確認します。

```bash
nvidia-smi
uv run --no-sync python - <<'PY'
import torch
print(torch.__version__, torch.cuda.is_available())
PY
```

GPU が表示され、PyTorch の結果が `True` なら、まず5000ステップで確認します。出力先は実行日時付きで作り、過去の成果を削除しません。

```bash
RUN_NAME="act-$(date +%Y%m%d-%H%M%S)"
TRAIN_OUTPUT_DIR="$HOME/handson-work/{{EVENT_ID}}"
TRAIN_OUTPUT_DIR+="/{{ATTENDEE_ID}}/outputs/$RUN_NAME"
export HF_HUB_OFFLINE=1
uv run --no-sync lerobot-train \
  --dataset.root="$DATASET_DIR" \
  --dataset.repo_id="$DATASET_REPO_ID" \
  --dataset.video_backend=pyav \
  --policy.type=act \
  --output_dir="$TRAIN_OUTPUT_DIR" \
  --job_name="$RUN_NAME" \
  --policy.device=cuda \
  --policy.push_to_hub=false \
  --save_checkpoint_to_hub=false \
  --wandb.enable=false \
  --steps=5000 \
  --save_freq=5000 \
  --batch_size=2 \
  --num_workers=0 \
  --policy.use_amp=true \
  --policy.use_vae=false \
  --policy.chunk_size=50 \
  --policy.n_action_steps=50
```

学習ログの終了とチェックポイントを確認します。5000ステップだけでタスクが成功するとは限りません。従来の Jetson の学習時間を EC2 の実績としては扱いません。

## 2. 学習の継続

`steps` は追加回数ではなく、継続後に到達させる総ステップ数です。5000から15000ステップへ続ける例です。

```bash
TRAIN_CONFIG_PATH="$TRAIN_OUTPUT_DIR/checkpoints/last"
TRAIN_CONFIG_PATH+="/pretrained_model/train_config.json"
uv run --no-sync lerobot-train \
  --config_path="$TRAIN_CONFIG_PATH" \
  --resume=true \
  --steps=15000 \
  --policy.push_to_hub=false \
  --save_checkpoint_to_hub=false \
  --wandb.enable=false
```

実際にできた `train_config.json` の場所を確認します。`RUN_NAME` と `TRAIN_OUTPUT_DIR` を控えます。

## AWS 経由でモデルを回収する

学習が正常に終了したら [AWS からのモデル回収](../aws-model-recovery.md)へ進みます。推論する手元の機器へチェックポイント全体を戻します。

## リファレンス

- [LeRobot v0.6.0](https://github.com/huggingface/lerobot/releases/tag/v0.6.0)
- [出典と検証範囲](../verification.md)

---

[前へ: データセットの編集](edit.md) · [次へ: AWS からのモデル回収](../aws-model-recovery.md)

{% if audience == "staff" %}

## 講師：学習前の環境の到達確認

GPU学習は未検証です。同じデータ・版・EC2での事前試験、GPUと依存、保存先、実行時間を確認してから開始します。学習なしコースでは情報表示とRerunで終了します。

{% endif %}
