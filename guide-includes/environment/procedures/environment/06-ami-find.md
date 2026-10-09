### 2.4 （任意）ソフトウェアを導入済みの AMI を用意する

2.3 の AMI（以下「元の AMI」）に講義で使うソフトウェアを入れた AMI（以下「導入済みの AMI」）を使うと、受講者全員のインスタンスが、そのソフトウェアが入った状態で起動します。
導入済みの AMI は、特定の開催のものではなく、同じ AWS アカウント・リージョンの複数の開催で使い回せます。
前の開催で作った導入済みの AMI を使うのが通常で、2.4.1 で見つかれば、その AMI ID を設定ファイルに書くだけで済みます。
新しく作るのは、使える導入済みの AMI がない場合だけです（2.4.2〜2.4.4）。
AMI の作成は AWS CLI で手動で行い、LeRobot の導入にはインフラリポジトリのシェルスクリプトを使います（理由は [インフラ構成の仕様](<<= guide_link('staff/environment/specs/infrastructure.md') =>>) の「AMI」）。
2.3 の AMI に必要なソフトウェアがそろっている場合は、2.4 を飛ばして 2.5 へ進みます。

#### 2.4.1 作ってある導入済みの AMI を探す

1. このアカウント・リージョンにある導入済みの AMI の ID、名前、作成日時、説明を表示します。

   説明には、入れたソフトウェアが書いてあります。

   ```bash
   aws ec2 describe-images --owners self \
     --filters Name=tag-key,Values=gclue-ai-handson-ami \
     --query 'Images[].[ImageId,Name,CreationDate,Description]' \
     --output text
   ```

2. 講義に合うものがあれば、その AMI の状態を確かめます。

   1 行目に `available` とルートデバイス名、2 行目以降にディスクごとのデバイス名・大きさ（GB）・スナップショット ID が表示されます。
   ルートデバイス名の行の大きさが、設定ファイルの `root_volume_size_gb` 以下であることを確かめます。

   ```bash
   QUERY='Images[0].[[State,RootDeviceName],BlockDeviceMappings[].'
   QUERY+='[DeviceName,Ebs.VolumeSize,Ebs.SnapshotId]]'

   aws ec2 describe-images --image-ids {{AMI_ID}} --query "$QUERY" \
     --output text
   ```

3. 使える AMI があれば、設定ファイルの `aws.handson_cdk.instance.ami_id` にその AMI ID を書き、2.4.5 の注意を読んでから 2.5 へ進みます。

   使える AMI がなければ、2.4.2 から新しく作ります。
