# LeRobotDocs

FaBo Physical Agent Kit のドキュメントです。MkDocs（Material for MkDocs）でビルドします。

## 開発環境

Dev container で、ビルドに必要なものがすべて揃います。

1. VS Code で本リポジトリを開き、「Reopen in Container」を実行する
2. 初回起動時に `requirements.txt` の依存が自動でインストールされる

CLI から使う場合は [Dev Containers CLI](https://github.com/devcontainers/cli) を使います。

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . mkdocs serve -a 0.0.0.0:8000
```

## プレビューとビルド

コンテナ内で実行します。

```bash
# プレビュー（http://localhost:8000、変更は自動で反映）
mkdocs serve -a 0.0.0.0:8000

# 静的サイトのビルド（出力先: site/）
mkdocs build
```

## 依存パッケージ

`requirements.txt` で固定しています。`mkdocs` は 1.x に固定しており、2.0 には上げないでください（`mkdocs-material` が MkDocs 2.0 を本番利用に不適と警告しているため）。

## AWS 講習会・受講者ドキュメントの開発契約

受講者版は `docs-aws-attendee/` と `mkdocs.aws-attendee.yml` で管理します。既存の `mkdocs.yml` から独立したビルドです。実測済み・手順照合のみ・未検証を区別し、秘密、アカウント固有値、期限付き URL はコミットせず置換値を使ってください。並列エージェントは別 checkout を使い、bind mount の dev container もエージェントごとに別のシャドウコピーを使います。

同じ固定依存を用意したコンテナ内、または専用 Python 仮想環境で実行します。

```bash
mkdocs serve -f mkdocs.aws-attendee.yml -a 0.0.0.0:8000
mkdocs build --strict -f mkdocs.aws-attendee.yml
```

出力先は `site-aws-attendee/` です。リンク先と見出しアンカーも警告として検証し、strict build で失敗させます。外部 URL の到達性、AWS 操作、EC2 上のコマンド実行はこのビルドでは検証しません。生成物はコミットしません。

### テーマと値設定の開発契約

既存テーマを基にした専用 `theme-aws-attendee/` と、専用docs配下の `assets/` を使用します。元の `theme/`、既存サイトのCSS/JSは変更しません。`common.md` が値設定ページです。

`aws-values.js` は既存 `lerobot_ports.js` のフォーム・保存・元テンプレート保持・MaterialライフサイクルをAWS向けに適応したものです。役割別の `lerobot.aws-guide.attendee.v1` だけを保存し、認証秘密や期限付きURLを扱いません。置換対象は列挙した `{{TOKEN}}` に限定します。パスをコマンドへ入れるときは引用済み引数を生成する `{{TOKEN_SH}}` を単独で使い、外側へ引用符を加えたり文字列を連結したりしません。AMI削除対象など、意味の異なる値を共通フォームへ機械的に統合しません。

変更時はstrict buildとリンク検査に加え、ブラウザで未入力・入力・ページ遷移・コピー・リセット、空白とアポストロフィを含むパス、役割間の保存分離を確認します。JavaScript無効時はトークンのままなので実行せず、値を手動確認してください。

AWSプロファイルもコマンド内では `{{PROFILE_SH}}`、YAML設定内では `{{PROFILE_YAML}}` として引用します。ID形式は参照元contractに合わせ、開催ID末尾ハイフンと受講者IDの予約語 `shared` は受け付けません。

全ページのヘッダーボタンからネイティブdialogを開き、設定ページと同じstateで双方向同期します。閉じる/Escape・フォーカス復帰・背景へのフォーカス移動抑止・狭い画面の内部スクロールも検証対象です。参考: `rd08-vfp-ai-exp-core/dist/guides/10_ガイド/AI実験_ガイド_PoC環境構築手順/` の全ページ共通モーダル（参照のみ）。


### 受講者版と講習会側版の静的テンプレート

共通本文は `docs-aws-attendee/` の同じMarkdownを使います。
`mkdocs-macros-plugin` のJinja2でビルド時に担当者手順を差し込みます。
章・ページの出し分けはブラウザのJavaScriptには依存しません。

```bash
# 受講者版: site-aws-attendee/
mkdocs build --strict -f mkdocs.aws-attendee.yml

# 講習会側版: site-aws-staff/
mkdocs build --strict -f mkdocs.aws-staff.yml
mkdocs serve -f mkdocs.aws-staff.yml -a 127.0.0.1:8004
```

- 受講者版は `extra.audience: attendee`。担当者の差し込みを省き、
  `staff/` の参照ページとスクリプトも出力対象から外します。
- 講習会側版は `extra.audience: staff`。受講者版の設定を `INHERIT`
  し、共通の章立てに事前準備・担当者の参照を加えます。
- 共通の受講者操作を直す場合は、通常の手順ページを編集します。
- 担当者手順は `guide-includes/` の部分Markdownを編集します。
  差し込み箇所と `staff/` の全文参照は同じ部分ファイルを使います。
  元資料の版・部分ファイル一覧は `guide-includes/sources.json` に記録。
  他の作業コピーからの自動同期は行いません。
- `aws_guide_macros.py` は相対リンクの解決と見出し階層の調整だけを
  担当します。シェルコマンドは実行しません。

差し込みの記法（リンクマクロはJinja用の区切り文字を使用）:

```jinja
{% if audience == "staff" %}
## 講師：導入前の認証情報の発行

{% filter staff_headings %}
{% include 'instructor/operations/06.md' %}
{% endfilter %}
{% endif %}
```

共通部分ファイルのリンクは、例えば以下のように記述します。
呼び出したページの場所に合わせて相対パスがビルド時に決まります。

```jinja
[共通設定](<<= guide_link('common.md') =>>)
```

Jinja変数は `<<= ... =>>`、コメントは `{## ... ##}` を使います。
既存のブラウザ値置換 `{{EVENT_ID}}`、Markdownの `{#anchor}`、
シェルのheredocやJMESPathの二重角括弧と衝突しない設定です。
未定義のJinja変数やテンプレートのエラーはビルドを失敗させます。

閲覧中の値入力・インポート・エクスポート・コピーは引き続きJSです。
講習会側版の値は `lerobot.aws-guide.staff.v1` に保存します。
認証情報発行・撤去等は手順を掲載しただけで、AWS操作はしていません。
