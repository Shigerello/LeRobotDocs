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
