# 手元の PC の準備と更新

最初に [共通値の設定](common.md) を開き、講師から受け取った値を入力してください。認証情報ファイルのパス・期限付き URL はフォームに保存せず、各コマンドの手動置換箇所で指定します。

実行場所: **手元の PC のターミナル**。macOS での導入は実測済みです。Ubuntu / Jetson / WSL は元手順に基づく案内で、今回の端末実測には含めません。

!!! warning "修正版の配布を確認してから開始"
    この資料は受講者ツールの修正 `fc6e58d` を含む版を前提にしています。2026-10-09 時点では配布済み旧版への更新は未実施です。講師に修正版の公開を確認し、新しい導入 URL を受け取ってください。旧配布先のまま `env update` しても修正版になるとは限りません。

## 用意するもの

講師から、次のものを受け取ります。

| 受け取るもの | 内容 |
| --- | --- |
| 認証情報ファイル | `{{ATTENDEE_ID}}.env` という名前のファイル。`{{ATTENDEE_ID}}.credentials` というファイルも一緒に渡された場合は、2 つを同じフォルダに置きます |
| 各種値の設定JSON | `{{ATTENDEE_ID}}.guide-settings.json`。受け取った場合は「各種値の設定」の「インポート」で読み込む |
| 導入スクリプトの URL | `https://` で始まる長い URL。有効期限があるため、受け取ったら早めに使います |

認証情報ファイルは、あなたとして AWS を操作できる鍵です。
他の人に渡したり、チャットに貼り付けたりしないでください。

手元の機器には、次の手順で必要なソフトウェアを入れておきます。

## 1. 必要なソフトウェアを入れる

使う機器の OS に合わせて準備します。
自分の EC2 へ接続しない機器（データのやり取りだけに使う Jetson など）では、Session Manager プラグイン・OpenSSH・git は不要です。

| ソフトウェア | 用途 |
| --- | --- |
| bash・curl | 導入スクリプトと講習会用のコマンドの実行 |
| AWS CLI v2 | AWS の操作 |
| Session Manager プラグイン | 自分の EC2 への接続 |
| OpenSSH（`ssh`・`ssh-keygen`） | SSH・git・VS Code での接続 |
| git | 手元のリポジトリと自分の EC2 のやり取り |

### 1.1 macOS の場合

macOS に最初から入っている bash と curl をそのまま使えます。
AWS CLI v2 と Session Manager プラグインは、次の AWS の公式の手順で入れます。
導入スクリプトは、macOS には AWS CLI v2 を自動では入れません。

- AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- Session Manager プラグイン: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

git が入っていない場合は、ターミナルで `git` を実行すると表示される案内に従って入れます。

### 1.2 Linux（Ubuntu・Jetson）の場合

curl・unzip・git・OpenSSH を入れます。

```bash
sudo apt install curl unzip git openssh-client
```

AWS CLI v2 が入っていなければ、導入スクリプトが講習会用のフォルダの中に入れます（x86_64 と aarch64 の機器に対応）。
Session Manager プラグインも、導入スクリプトの `--with-ssm-plugin` で講習会用のフォルダの中に入れられます。

### 1.3 Windows の場合

Windows では WSL（Windows Subsystem for Linux）の Ubuntu の中で使います。
WSL の Ubuntu を入れたら、Ubuntu のターミナルを開き、上の「Linux（Ubuntu・Jetson）の場合」と同じ手順で進めます。
以降のコマンドは、すべて WSL の Ubuntu のターミナルで実行します。

### 1.4 入ったことを確かめる

次のコマンドを 1 つずつ実行し、バージョンが表示されることを確かめます。

```bash
bash --version
```

```bash
curl --version
```

```bash
aws --version
```

`aws --version` は `aws-cli/2.` で始まる表示であれば使えます。
Linux で AWS CLI を導入スクリプトに入れてもらう場合は、ここで見つからなくてもかまいません。

自分の EC2 へ接続する機器では、次も確かめます。

```bash
session-manager-plugin --version
```

```bash
ssh -V
```

```bash
git --version
```

{% if audience == "staff" %}

## 講師：導入前の認証情報の発行

以下は講師の運用環境で実行します。受講者に導入URLと本人の認証ファイルを渡してから、受講者の導入手順へ進みます。

{% filter staff_headings %}
{% include 'instructor/operations/06.md' %}
{% endfilter %}

{% endif %}

## 2. 講習会用の環境を用意する

導入スクリプトを取得して実行すると、講習会用のコマンドと講義資料が 1 つのフォルダ（既定は `~/gclue-ai-handson/{{EVENT_ID}}/`）にまとめて用意されます。
そのフォルダの外には何も書き込まず、管理者の権限（sudo）も使いません。

1. 導入スクリプトを取得します。

   ```bash
   curl -fsSL '<導入スクリプトの URL>' -o bootstrap.sh
   ```

   - `<導入スクリプトの URL>`: 講師から受け取った URL。前後の `'` は消さずに、その間に貼り付けます。

   エラーが表示されずに終わり、`bootstrap.sh` というファイルができていれば成功です。

2. 受け取った認証情報ファイルを指定して、導入スクリプトを実行します。

   ```bash
   bash bootstrap.sh --env-file '<認証情報ファイルの絶対パス>'
   ```

   絶対パスの説明用の例は、Macなら `/Users/student/Downloads/attendee01.env`、Jetsonなら `/home/student/Downloads/attendee01.env` です。`student`は本人の端末のユーザー名、ファイル名は配布された自分のものに置き換えます。これはファイルの場所で、認証情報の本文を貼り付ける欄ではありません。

   - `<認証情報ファイル>`: 受け取った `{{ATTENDEE_ID}}.env` のパス（絶対パスを指定します）。

   講師が公開している最新の講義資料も一緒に取得されます。
   最後に `gclue-ai-handson の実行環境を用意しました:` と、用意したフォルダの場所・受講者 ID・開催 ID が表示されれば成功です。
   表示された開催 ID は、[共通値の設定](common.md) の開催 ID に入力します。

   必要に応じて、次のオプションを付けます。

   | オプション | 使う場面 |
   | --- | --- |
   | `--with-ssm-plugin` | Linux で Session Manager プラグインが入っていないとき。講習会用のフォルダの中に入れます |
   | `--version <版>` | 講師から特定の講義資料の版を指示されたとき |
   | `--no-materials` | 講義資料を取得せず、コマンドだけを用意するとき |
   | `--dir <フォルダ>` | 既定とは別の場所に用意するとき |
   | `--no-hook` | 講義資料に含まれる機器の準備作業を実行しないとき（講師から指示された場合だけ） |

   講義資料がまだ公開されていない場合は、資料を取得せずに終わります。
   公開後に「4. 講習会用の環境を更新する」の手順で取得できます。

同じコマンドをもう一度実行すると、同じフォルダの内容を更新します。

## 3. 講習会用の環境を有効にする

新しくターミナルを開いたら、毎回最初に次のコマンドを実行します。

```bash
source ~/gclue-ai-handson/{{EVENT_ID}}/activate
```

- `{{EVENT_ID}}`: 導入スクリプトの最後に表示された開催 ID。`--dir` で場所を変えた場合は、そのフォルダの `activate` を指定します。

有効になったことを確かめます。

```bash
gclue-ai-handson-attendee env info
```

フォルダの場所、開催 ID、受講者 ID、講義資料の版、認証情報の有効期限が表示されれば成功です。

元の状態に戻すときは、次のコマンドを実行します。

```bash
gclue_ai_handson_deactivate
```

各コマンドの使い方は、`gclue-ai-handson-attendee <コマンド> -h`（例: `gclue-ai-handson-attendee files -h`）で表示できます。

## 4. 講習会用の環境を更新する

講師から更新するよう案内があったら、次のコマンドを実行します。
講習会用のコマンドと、講師が公開している最新の講義資料を取得し直します。

```bash
gclue-ai-handson-attendee env update
```

`講義資料の版 <版> を … に用意しました。` と表示されれば成功です。
講義資料は `~/gclue-ai-handson/{{EVENT_ID}}/materials/current/` から開けます。

- 特定の版を指示された場合は、`--version <版>` を付けます。
- コマンドだけを更新する場合は、`--tools-only` を付けます。

## 5. 認証情報を入れ替える

認証情報には有効期限があります（`env info` の「認証情報の有効期限」）。
期限が切れたときや、講師から新しい認証情報ファイルを受け取ったときは、次のコマンドで入れ替えます。

```bash
gclue-ai-handson-attendee env credentials \
  --env-file '<新しい認証情報ファイルの絶対パス>'
```

- `<新しい認証情報ファイル>`: 新しく受け取った `{{ATTENDEE_ID}}.env` のパス。

`認証情報を … に置きました。` と表示されたら、開いているターミナルごとに `activate` を読み込み直します。

```bash
source ~/gclue-ai-handson/{{EVENT_ID}}/activate
```

`env info` で、認証情報の有効期限が新しくなっていることを確かめます。


次は [EC2 への接続](connect.md) に進みます。

{% if audience == "staff" %}

## 講師：導入・更新後の確認

本人の開催ID・受講者ID・有効期限を確認します。

{% filter staff_headings %}
{% include 'instructor/support/01.md' %}
{% endfilter %}

{% endif %}
