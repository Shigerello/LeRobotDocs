#!/usr/bin/env bash
# Ubuntu 24.04のEC2に、LeRobotの学習・編集・可視化用の環境を導入する。
set -euo pipefail

readonly UV_VERSION=0.12.23
readonly AWS_CLI_VERSION=2.37.10
readonly LEROBOT_TAG=v0.6.0
readonly LEROBOT_COMMIT=30da8e687a6dfc617fcd94afc367ac7071c376ce
lerobot_dir="$HOME/lerobot"
check_gpu=0
cache_resnet18=0
terminal_font=0
work_dir=""

usage() {
    cat <<'EOF'
使い方: bash setup-lerobot-ec2.sh [オプション]

Ubuntu 24.04 / x86_64のEC2でubuntuユーザーとして実行します。
OSパッケージとAWS CLIの導入にsudoを使います。
LeRobotはv0.6.0、uvは0.12.23、AWS CLIは2.37.10に固定します。

オプション:
  --lerobot-dir PATH  LeRobotの配置先（既定: ~/lerobot、絶対パス）
  --check-gpu         CUDAの認識とGPUでの小さな行列計算を確認する
  --cache-resnet18    ACTのResNet18の重みを事前に取得する
  --terminal-font    DCV内でGNOME Terminalの既定プロファイルをMonospace 12にする
  -h, --help         この説明を表示する

同じ版の既存環境は再利用します。異なる版のuv・AWS CLIや、
別のコミット・変更済みのLeRobotがある場合は停止します。
データセットの取得、学習、AMI作成は行いません。
EOF
}

fail() { printf 'エラー: %s\n' "$*" >&2; exit 1; }
cleanup() {
    if [[ -n "$work_dir" ]]; then rm -rf -- "$work_dir"; fi
}
trap cleanup EXIT
trap 'printf "エラー: 導入に失敗しました（行 %s）。上の出力を確認してください。\n" "$LINENO" >&2' ERR

while [[ $# -gt 0 ]]; do
    case "$1" in
        --lerobot-dir)
            [[ $# -ge 2 && -n "$2" ]] || fail '--lerobot-dirには絶対パスが必要です'
            lerobot_dir=$2; shift 2 ;;
        --check-gpu) check_gpu=1; shift ;;
        --cache-resnet18) cache_resnet18=1; shift ;;
        --terminal-font) terminal_font=1; shift ;;
        -h|--help) usage; exit 0 ;;
        *) fail "不明な引数: $1" ;;
    esac
done

[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || fail 'Linux x86_64で実行してください'
[[ $(id -un) == ubuntu && $EUID -ne 0 ]] || fail 'sudoでスクリプト全体を実行せず、ubuntuユーザーで実行してください'
# Ubuntu標準のOS識別情報を使い、異なるディストリビューションへの導入を止める。
source /etc/os-release
[[ $ID == ubuntu && $VERSION_ID == 24.04 ]] || fail 'Ubuntu 24.04が必要です'
[[ $lerobot_dir == /* && $lerobot_dir != / ]] || fail '--lerobot-dirにはルート以外の絶対パスを指定してください'
[[ ! -L "$lerobot_dir" ]] || fail 'LeRobotの配置先にシンボリックリンクは指定できません'
command -v python3.12 >/dev/null || fail 'Python 3.12が必要です'
command -v sudo >/dev/null || fail 'sudoが必要です'

uv_bin="$HOME/.local/bin/uv"
if [[ -x "$uv_bin" ]]; then
    [[ $("$uv_bin" --version) == "uv $UV_VERSION" || $("$uv_bin" --version) == "uv $UV_VERSION "* ]] || fail "既存のuvが${UV_VERSION}ではありません: $uv_bin"
fi
if command -v aws >/dev/null; then
    [[ $(aws --version 2>&1) == "aws-cli/$AWS_CLI_VERSION "* ]] || fail "既存のAWS CLIが${AWS_CLI_VERSION}ではありません"
elif [[ -e /usr/local/aws-cli || -e /usr/local/bin/aws || -L /usr/local/bin/aws ]]; then
    fail 'AWS CLIの既存ファイルがありますがawsを実行できません。配置とPATHを確認してください'
fi
if [[ -e "$lerobot_dir" ]]; then
    command -v git >/dev/null || fail '既存LeRobotの確認にgitが必要です'
    [[ -d "$lerobot_dir/.git" ]] || fail "配置先がGitリポジトリではありません: $lerobot_dir"
    [[ $(git -C "$lerobot_dir" rev-parse HEAD) == "$LEROBOT_COMMIT" ]] || fail '既存LeRobotのコミットがv0.6.0の検証対象と異なります'
    [[ -z $(git -C "$lerobot_dir" status --porcelain --untracked-files=no) ]] || fail '既存LeRobotにコミットされていない変更があります'
fi
if [[ $terminal_font -eq 1 ]]; then
    [[ -n ${DBUS_SESSION_BUS_ADDRESS:-} ]] || fail '--terminal-fontはDCVデスクトップのTerminal内で実行してください'
    command -v gsettings >/dev/null || fail 'GNOMEのgsettingsが必要です'
fi

printf '\n1/5 OSパッケージを導入します\n'
sudo apt-get update
sudo apt-get install -y git git-lfs curl unzip less groff ffmpeg python3.12-venv
git lfs install --skip-repo

work_dir=$(mktemp -d)
printf '\n2/5 uvとAWS CLIを導入します\n'
if [[ ! -x "$uv_bin" ]]; then
    curl -fsSL "https://astral.sh/uv/$UV_VERSION/install.sh" -o "$work_dir/uv-install.sh"
    UV_INSTALL_DIR="$HOME/.local/bin" sh "$work_dir/uv-install.sh"
fi
[[ $("$uv_bin" --version) == "uv $UV_VERSION" || $("$uv_bin" --version) == "uv $UV_VERSION "* ]] || fail 'uvの導入結果が指定の版と異なります'
if ! command -v aws >/dev/null; then
    curl -fSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-$AWS_CLI_VERSION.zip" -o "$work_dir/awscliv2.zip"
    unzip -q "$work_dir/awscliv2.zip" -d "$work_dir"
    sudo "$work_dir/aws/install" --install-dir /usr/local/aws-cli --bin-dir /usr/local/bin
fi
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"
hash -r
[[ $(aws --version 2>&1) == "aws-cli/$AWS_CLI_VERSION "* ]] || fail 'AWS CLIの導入結果が指定の版と異なります'

printf '\n3/5 LeRobotと依存を導入します\n'
if [[ ! -e "$lerobot_dir" ]]; then
    git clone --branch "$LEROBOT_TAG" --depth 1 https://github.com/huggingface/lerobot.git "$lerobot_dir"
fi
[[ $(git -C "$lerobot_dir" rev-parse HEAD) == "$LEROBOT_COMMIT" ]] || fail '取得したLeRobotのコミットが検証対象と異なります'
cd "$lerobot_dir"
"$uv_bin" sync --locked --extra training --extra dataset_viz --python 3.12

printf '\n4/5 導入結果を確認します\n'
"$uv_bin" --version
aws --version
git lfs version
ffmpeg -version | sed -n '1p'
ffplay -version 2>&1 | sed -n '1p'
"$uv_bin" run --no-sync python - <<'PY'
from importlib.metadata import version
import av
import torch
import torchcodec
import torchvision
for package in ('lerobot', 'torch', 'torchvision', 'av', 'torchcodec', 'rerun-sdk'):
    print(f'{package}: {version(package)}')
print(f'CUDA実行時: {torch.version.cuda}')
PY
for cli in lerobot-train lerobot-edit-dataset lerobot-dataset-viz rerun; do
    "$uv_bin" run --no-sync "$cli" --help >/dev/null
    printf '%s: ヘルプ表示成功\n' "$cli"
done

printf '\n5/5 任意の準備・確認を行います\n'
if [[ $check_gpu -eq 1 ]]; then
    "$uv_bin" run --no-sync python - <<'PY'
import torch
if not torch.cuda.is_available():
    raise SystemExit('CUDAを認識できません。NVIDIAドライバーを確認してください。')
x = torch.ones((16, 16), device='cuda')
assert torch.all(x @ x == 16).item()
torch.cuda.synchronize()
print(f'GPU計算成功: {torch.cuda.get_device_name(0)}')
PY
fi
if [[ $cache_resnet18 -eq 1 ]]; then
    "$uv_bin" run --no-sync python - <<'PY'
from torchvision.models import ResNet18_Weights, resnet18
resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
print('ResNet18の重みを取得しました。')
PY
fi
if [[ $terminal_font -eq 1 ]]; then
    profile=$(gsettings get org.gnome.Terminal.ProfilesList default | tr -d "'")
    [[ $profile =~ ^[0-9a-fA-F-]{36}$ ]] || fail 'GNOME Terminalの既定プロファイルを取得できません'
    schema="org.gnome.Terminal.Legacy.Profile:/org/gnome/terminal/legacy/profiles:/:$profile/"
    gsettings set "$schema" use-system-font false
    gsettings set "$schema" font 'Monospace 12'
    gsettings set "$schema" cell-width-scale 1.0
    gsettings set "$schema" cell-height-scale 1.0
fi
printf '\nソフトウェア環境の導入と基本確認が完了しました。\n'
printf 'LeRobot: %s\n' "$lerobot_dir"
printf '利用時: cd %q && ~/.local/bin/uv run --no-sync <コマンド>\n' "$lerobot_dir"
printf '学習の実行とデータを変更する編集操作は別途確認してください。\n'
