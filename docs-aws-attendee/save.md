# 成果を保存して手元に取り戻す

最初に [共通値の設定](common.md) を開き、講師から受け取った値を入力してください。認証情報ファイルのパス・期限付き URL はフォームに保存せず、各コマンドの手動置換箇所で指定します。

学習の完了を前提とせず、まず小さなテキストファイルで経路を確認できます。S3 への小さなファイルの保存・再取得と内容一致は実測済みです。最終成果をすべて回収する講習会終了工程は未実施です。

## 9. 学習済みウェイトなどの成果を保存し、取り戻す

成果は、講習会用の保存場所の「自分専用の場所」に保存します。
講師が用意した講義資料やデータセットの場所には書き込めません。

### 9.1 手元の機器から保存する

```bash
gclue-ai-handson-attendee files upload ./checkpoints --to models/day1
```

- `./checkpoints`: 保存するファイルまたはフォルダ。フォルダを指定すると、その名前のフォルダとして保存します。
- `--to <保存先>`: 自分専用の場所の中の保存先（例: `models/day1`）。省略すると、自分専用の場所の直下に保存します。

`… にアップロードしました。` と表示されれば成功です。

### 9.2 自分の EC2 から保存する

講師が自分の EC2 に認証情報ファイルを書き込んだ場合は、自分の EC2 から直接保存できます。
SSH か DCV のターミナル（`ubuntu` ユーザー）で、次のコマンドを順に実行します。

```bash
source /tmp/gclue-ai-handson-{{EVENT_ID}}-{{ATTENDEE_ID}}.env
```

```bash
aws s3 cp --recursive ./checkpoints "s3://$GCLUE_AI_HANDSON_BUCKET/$GCLUE_AI_HANDSON_ATTENDEE/models/day1/checkpoints/"
```

- 認証情報ファイルの場所は、講師から別の場所を案内された場合はそれに従います。
- `./checkpoints`: 保存するフォルダ。`models/day1/checkpoints/` は保存先で、変えてもかまいません。

エラーが表示されずに、`upload:` で始まる行がファイルごとに表示されれば成功です。

### 9.3 保存した成果を取り戻す

自分専用の場所に保存した成果を、手元の機器に取得します。

```bash
gclue-ai-handson-attendee files pull --own --prefix models/day1 --dest ./recovered
```

- `--own`: 自分専用の場所から取得します。
- `--prefix <保存先>`: 保存したときの保存先（`--to` に指定した値）。省略すると自分専用の場所の全体を取得します。
- `--dest <フォルダ>`: 手元の保存先のフォルダ。

`… を ./recovered に取得しました。` と表示されれば成功です。


## 保存経路を内容一致まで確認する

**手元の PC** で空の作業フォルダから実行します。

```bash
mkdir -p ~/handson-save-check
cd ~/handson-save-check
printf "handson save check\n" > proof.txt
gclue-ai-handson-attendee files upload ./proof.txt --to checks/day1
gclue-ai-handson-attendee files pull --own --prefix checks/day1 --dest ./downloaded
cmp proof.txt downloaded/proof.txt
```

`cmp` が何も表示せず終了すれば内容が一致しています。フォルダを upload した場合はフォルダ名も保存されるので、例の `checkpoints` は回収先の `./recovered/checkpoints/` に入ります。

EC2 で AWS CLI を使うときは、講師が用意した一時認証情報を読み込んでから実行し、有効期限切れなら再配布を依頼してください。`aws s3 cp` の成功だけで回収完了とせず、手元へ戻したファイルのサイズ・ハッシュまたは `cmp` も確認します。

次は [終了時の片付け](finish.md) です。
