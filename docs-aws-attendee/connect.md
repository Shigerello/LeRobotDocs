# AWS コンソールと EC2 への接続

最初に [共通値の設定](common.md) を開き、講師から受け取った値を入力してください。認証情報ファイルのパス・期限付き URL はフォームに保存せず、各コマンドの手動置換箇所で指定します。

最初のコマンドはすべて **手元の PC** で実行します。`shell` / `ssh` で接続した後は **EC2** です。`exit` で手元に戻ります。DCV は手元のトンネル用ターミナルを開いたまま使います。

## 6. AWS マネジメントコンソールを開く

```bash
gclue-ai-handson-attendee console-url --open
```

ブラウザで AWS マネジメントコンソールが開けば成功です。
ブラウザが開かない場合は、表示された URL をブラウザに貼り付けます。
URL は発行から約 15 分で使えなくなり、知っている人は誰でもあなたとしてサインインできるため、共有しないでください。

## 7. 自分の EC2 に接続する

### 7.1 シェルで接続する

```bash
gclue-ai-handson-attendee shell
```

自分の EC2 のプロンプトが表示されれば成功です。
終了するときは `exit` を入力します。

シェルで接続したときのユーザーは `ssm-user` です。
SSH や DCV と同じ `ubuntu` ユーザーとして作業するときは、接続後の **EC2** で次を実行します。

```bash
sudo -iu ubuntu
```

この切替後は `exit` で `ssm-user` に戻り、もう一度 `exit` で手元に戻ります。

### 7.2 DCV（リモートデスクトップ）のパスワードを設定する（初回だけ）

DCV には `ubuntu` ユーザーのパスワードでログインします。
最初は誰も知らないパスワードになっているため、DCV を使う前に自分のパスワードを設定します。

1. シェルで自分の EC2 に接続します（`gclue-ai-handson-attendee shell`）。
2. 次のコマンドを実行し、表示に従って新しいパスワードを 2 回入力します。

   ```bash
   sudo /var/lib/handson/bin/handson-dcv-password set
   ```

   入力した文字は画面に表示されません。
   パスワードは 8 文字以上にします。
   `ubuntu のパスワードを設定しました。` と表示されれば成功です。

3. `exit` でシェルを終了します。

パスワードを忘れたときは、同じ手順で設定し直します。

### 7.3 DCV で接続する

```bash
gclue-ai-handson-attendee dcv
```

`https://localhost:8443/` と表示されたら、このコマンドを実行したままブラウザでその URL を開き、ユーザー名 `ubuntu` と設定したパスワードでログインします。
デスクトップが表示されれば成功です。
終了するときは、コマンドを実行したターミナルで Ctrl+C を押します。

- 手元のポート 8443 が他で使われている場合は、`--local-port <ポート番号>`（例: `--local-port 8444`）を付けます。表示される URL のポート番号も変わります。
- ブラウザに証明書の警告が表示された場合は、講師の案内に従って進めます。

### 7.4 SSH で接続する

```bash
gclue-ai-handson-attendee ssh
```

`ubuntu@` で始まるプロンプトが表示されれば成功です。
終了するときは `exit` を入力します。

- SSH には、講習会用のフォルダの中に自動で作る専用の鍵を使います。普段使っている SSH の鍵や設定は使いません。
- 接続のたびに、接続の準備と、接続先が自分の EC2 であることの確認を自動で行います。接続先を信頼するかどうかの確認（`yes/no`）は表示されません。
- 接続の準備のため、プロンプトが表示されるまで少し時間がかかります。
- `exit` の後、手元のプロンプトが戻ってから `警告:` で始まるメッセージが表示されることがあります。「うまくいかないとき」の表を見てください。
- 手元のポートを転送する場合は、`ssh` のオプションをそのまま付けられます（例: `gclue-ai-handson-attendee ssh -L 8000:localhost:8000`）。
- 1 つのコマンドだけを実行する場合は、`--` のあとに書きます（例: `gclue-ai-handson-attendee ssh -- nvidia-smi`）。

### 7.5 手元のリポジトリを自分の EC2 とやり取りする（git）

手元のリポジトリのフォルダで次のコマンドを実行すると、今のブランチのコミットを自分の EC2 へ送ります。

```bash
gclue-ai-handson-attendee git push
```

`<ブランチ> を接続先の /home/ubuntu/<リポジトリ名> へ push しました。` と表示されれば成功です。
初めて送るときは、自分の EC2 の `/home/ubuntu/<リポジトリ名>` にリポジトリが作られます。

自分の EC2 でコミットした内容を手元に取り込むときは、次のコマンドを実行します。

```bash
gclue-ai-handson-attendee git pull
```

`<ブランチ> を接続先の /home/ubuntu/<リポジトリ名> から pull しました。` と表示されれば成功です。

今のブランチとは別のブランチを取り込むときは、`--branch <ブランチ>` を付けます。

```bash
gclue-ai-handson-attendee git pull --branch '<ブランチ>'
```

手元の作業中のファイルは変わりません。
`手元の現在のブランチは変えていません。切り替えるには: git switch <ブランチ>` と表示されるので、必要になったら表示されたコマンドで切り替えます。

- 送られるのはコミット済みの内容だけです。コミットしていない変更は送られません。
- `git push` では、手元のリポジトリに設定した名前とメールアドレス（`user.name`・`user.email`）も自分の EC2 のリポジトリに設定されます。自分の EC2 で作るコミットにも同じ名前が記録されます。
- リポジトリにサブモジュールがある場合は、`git push` がサブモジュールも一緒に送ります。先に下の「サブモジュールを用意する」を実行してください。
- `git push`・`git pull` は内部で何回か接続するため、終わるまで少し時間がかかります。
- 自分の EC2 の場所を変える場合は、`--remote-dir <場所>`（例: `--remote-dir /home/ubuntu/work/repo`）を付けます。
- 手元のリポジトリの外から実行する場合は、`--repo <手元のリポジトリのフォルダ>` を付けます。

#### サブモジュールを用意する

実行場所: **手元の PC の、送信する Git リポジトリのフォルダ**。サブモジュールを使う教材で、Git push の前に実行します。

```bash
git submodule update --init
```

エラーなく終了したら、上の `gclue-ai-handson-attendee git push` を実行します。取得権限のエラーが出る場合は、教材リポジトリへのアクセス権を講師に確認してください。

### 7.6 普段の ssh・scp・VS Code から接続する

普段の `ssh`・`scp`・`rsync`・`git` や VS Code の Remote-SSH から接続できるように、設定ファイルを作ります。

1. 設定ファイルを作ります。

   ```bash
   gclue-ai-handson-attendee ssh-config
   ```

   `SSH の設定ファイルを書き出しました:` と、`Include "…"` で始まる 1 行が表示されます。

2. 表示された `Include "…"` の 1 行を、手元の `~/.ssh/config` の先頭に追加します（ファイルがなければ作ります）。
   このコマンドは `~/.ssh/config` を自動では変更しません。

3. 接続できることを確かめます。

   ```bash
   ssh gclue-ai-handson-{{EVENT_ID}}
   ```

   `ubuntu@` で始まるプロンプトが表示されれば成功です。

VS Code では、Remote-SSH 拡張機能の「Connect to Host」で `gclue-ai-handson-{{EVENT_ID}}` を選びます。
Windows では、WSL の中の VS Code の設定を Windows 側の VS Code は読まないため、この方法は使えません。

- 認証情報を入れ替えても、設定ファイルを作り直す必要はありません。接続のたびに講習会用のフォルダの認証情報を読み込みます。
- 講師から自分の EC2 が作り直されたと案内された場合は、`ssh-config` をもう一度実行します。
- 接続のたびに準備を行うため、`ssh gclue-ai-handson-{{EVENT_ID}}` も VS Code も、つながるまで少し時間がかかります。VS Code で接続がタイムアウトする場合は、VS Code の設定の `remote.SSH.connectTimeout` を大きく（例: `60`）します。


## S3 の画面を開く場合

受講者にはバケット一覧の権限がありません。一覧画面の `AccessDenied` は必ずしも認証失敗ではありません。講師からバケット名、リージョン、自分のプレフィックスを受け取り、サインインした同じブラウザで次の形式を開きます。[共通値の設定](common.md)のバケット・リージョン・受講者 ID が反映された URL を使います。

```text
https://s3.console.aws.amazon.com/s3/buckets/{{BUCKET}}?region={{REGION}}&prefix={{ATTENDEE_ID}}%2F&showversions=false
https://s3.console.aws.amazon.com/s3/buckets/{{BUCKET}}?region={{REGION}}&prefix=shared%2F&showversions=false
```

自分の領域と `shared/` の直接表示は実測済みです。画面でのダウンロード・書き込み・削除は未検証です。[CLI で保存と回収](save.md) を進めてください。`ListAllMyBuckets` 権限の追加は前提にしません。

## Git 往復の小さな練習

受講者ツールは修正版が必要です。手元に既存の教材リポジトリがある場合はそれを使います。練習用に新規作成する場合は、手元で次を実行します。`<表示名>` と `<メールアドレス>` を自分のコミット用の値に置き換えます。

```bash
mkdir -p ~/handson-practice
cd ~/handson-practice
git init -b practice
git config user.name '<表示名>'
git config user.email '<メールアドレス>'
printf 'local\n' > result.txt
git add result.txt
git commit -m 'Add local result'
gclue-ai-handson-attendee git push
gclue-ai-handson-attendee ssh
```

続いて **EC2** で実行します。

```bash
cd /home/ubuntu/handson-practice
printf 'ec2\n' >> result.txt
git add result.txt
git commit -m 'Add EC2 result'
exit
```

**手元** に戻って実行します。

```bash
cd ~/handson-practice
gclue-ai-handson-attendee git pull
cat result.txt
git log -2 --oneline
```

`local` と `ec2` の 2 行、両方のコミットが確認できれば成功です。認証情報・データセット・巨大なモデルはこの練習リポジトリへ追加しません。

次は [教材の取得と LeRobot の表示](dataset.md) に進みます。
