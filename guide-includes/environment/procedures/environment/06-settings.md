## 2. 開催の設定ファイルを用意する

### 2.1 記載例をコピーする

[共通設定](<<= guide_link('common.md') =>>) の設定ディレクトリ（`{{CONFIG_DIR}}`）を使います。開催ごとに別のディレクトリにしてください。
`config/environments/` は Git の管理対象外です。

```bash
mkdir -p {{CONFIG_DIR_SH}}
```

```bash
cp config/env.template/gclue-ai-handson-config.yml {{CONFIG_DIR_SH}}
```

### 2.2 値を埋める

`{{CONFIG_DIR}}/gclue-ai-handson-config.yml` をエディタで開き、次の値を埋めます。

| 項目 | 埋める値 | 値の調べ方 |
| --- | --- | --- |
| `aws.profile` | 1.1 で用意したプロファイル名 | 管理者から受け取る |
| `aws.handson.deployment_id` | 開催 ID | 用意するもの |
| `aws.handson.account` | アカウント ID（12 桁。`"` で囲む） | 1.3 で表示した値 |
| `aws.handson.region` | リージョン（例: `ap-northeast-1`） | 管理者から受け取る |
| `aws.handson.attendees` | 受講者 ID の一覧（1 件につき EC2 を 1 台作る。`shared` は使えない） | 用意するもの |
| `aws.handson.attendee_console_access` | 受講者のAWSコンソール利用。真偽値 `true` / `false`、省略時true。インフラと資料で同じ開催YAMLを使用 | アクセス制御仕様の切替・適用確認に従う |
| `aws.handson.max_session_duration_seconds` | 受講者に渡す認証情報の有効期間の上限（秒、3600〜43200）。通常は 43200（12 時間）のまま | — |
| `aws.handson.dcv_port` | DCV の待ち受けポート。通常は 8443 のまま | — |
| `aws.handson_cdk.network.vpc_cidr` | VPC の IP アドレスの範囲。アカウント内の他の VPC と重ならなければ記載例のまま | 下の VPC CIDR 確認コマンド |
| `aws.handson_cdk.network.availability_zones` / `max_azs` | 2.6 を参照 | 2.6 |
| `aws.handson_cdk.instance.ami_id` | AMI ID | 2.3（2.4 で導入済みの AMI にした場合はその AMI ID） |
| `aws.handson_cdk.instance.instance_type` | インスタンスタイプ。通常は `g6e.2xlarge` のまま | — |
| `aws.handson_cdk.instance.root_volume_size_gb` | ルートディスクの容量（GB）。通常は 512 のまま | — |
| `aws.handson_cdk.instance.root_device_name` | AMI のルートデバイス名 | 2.5 |
| `aws.handson_cdk.instance.availability_zone` | インスタンスを置く Availability Zone（任意） | 2.6 |
| `aws.handson_cdk.issuer.access_key_serial` | 1 のまま | 変えるのは 6.4 のときだけ |

手元の Terminal（インフラリポジトリ直下）で、既存 VPC の CIDR を確認します。表示された範囲と重ならない範囲を設定してください。

```bash
aws ec2 describe-vpcs --query 'Vpcs[].CidrBlock' --output text
```

### 2.3 AMI を選ぶ

今回の再現対象は **Ubuntu 24.04 / x86_64 / Python 3.12 / NVIDIA ドライバー導入済み** の AMI です。管理者から対象リージョンで利用できる AMI ID を受け取り、次で状態・OS の説明・アーキテクチャを確認します。起動後は下の EC2 内確認も行います。`available`、`x86_64` と対象の説明が成功条件です。

```bash
aws ec2 describe-images --image-ids {{AMI_ID}} \
  --query 'Images[0].[State,Architecture,Name,Description]' \
  --output text
```

AMI から起動した EC2 に接続した後、**EC2 の Terminal（`ubuntu` ユーザー）**で実行します。OS が Ubuntu 24.04、アーキテクチャが `x86_64` であり、`nvidia-smi` がエラーなくドライバーと GPU の情報を表示することを確認します。

```bash
cat /etc/os-release
uname -m
nvidia-smi
```

Ubuntu 22.04 の AMI は、同梱スクリプトの対象外です。DCV と NVIDIA ドライバーの導入はこのスクリプトに含まれないため、それらが備わる AMI を用意します。今回の資料では新しい AMI の取得・起動・作成を実施していません。

次の機能を使う講習会では、AMI に条件があります（理由は [インフラ構成の仕様](<<= guide_link('staff/environment/specs/infrastructure.md') =>>)）。

- DCV（リモートデスクトップ）で接続する: Amazon DCV サーバーを入れた AMI が必要です。Deep Learning AMI には入っていません。
- 受講者が SSH・git で接続する: SSH のサーバー（sshd）、`git`、`flock` が入っていて、Session Manager で入ったユーザーから `ubuntu` ユーザーへパスワードなしで `sudo` できる AMI が必要です。Ubuntu の AWS 公式の AMI と Deep Learning AMI は、通常この条件を満たします。

講義に使う大きなソフトウェア（PyTorch、LeRobot とその依存など）が 2.3 の AMI に入っていない場合は、次の 2.4 で、それを入れた AMI を用意します。
