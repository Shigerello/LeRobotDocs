# 講習会側の事前準備

受講者の実習を始める前に、環境構築担当者が環境を構築し、講師が教材を配布します。以降の共通ページでは、受講者の操作と担当者の操作を同じ順番で確認できます。

運用・構築コマンドは **ai-learning-handson-aws-infra の作業環境**で実行します。受講者のPCやLeRobotDocsで実行するコマンドと区別してください。

{% if audience == "staff" %}

## 環境構築担当者：開始条件と環境の構築

AWS 管理者と構築担当者が実施します。既存環境の場合も設定・版・接続条件を確認します。

{% filter staff_headings %}
{% include 'environment/index/00.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/index/01.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/01.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/02.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/03.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/04.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/05.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/06.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/07.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/08.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/procedures/environment/09.md' %}
{% endfilter %}

{% endif %}

{% if audience == "staff" %}

## 環境構築担当者：講師への引き渡し



{% filter staff_headings %}
{% include 'environment/handoff/00.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/handoff/01.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'environment/handoff/02.md' %}
{% endfilter %}

{% endif %}

{% if audience == "staff" %}

## 講師：運用ツールと教材の準備

初回配布は受講者がEC2で作業を始める前に行います。講義中の訂正は事前確認後に適用します。

{% filter staff_headings %}
{% include 'instructor/index/00.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/index/01.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/index/02.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/index/03.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/operations/00.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/operations/01.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/operations/02.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/operations/03.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/operations/04.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/operations/05.md' %}
{% endfilter %}

{% filter staff_headings %}
{% include 'instructor/operations/07.md' %}
{% endfilter %}

{% endif %}


[受講者のPCの準備へ](../setup.md)
