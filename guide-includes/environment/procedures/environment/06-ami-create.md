#### 2.4.4 AMI を作る

1. 一時的なインスタンスを停止します。

   エラーが表示されずに 2 つ目のコマンドが終われば、停止しています。

   ```bash
   aws ec2 stop-instances --instance-ids <一時的なインスタンス ID>
   ```

   ```bash
   aws ec2 wait instance-stopped \
     --instance-ids <一時的なインスタンス ID>
   ```

2. AMI を作ります。

   `<AMI の名前>` は、2.4.2 の決まりに沿った名前（例: `GClueAiHandsOn-AMI-lerobot-20261008`）にします。
   AMI とそのスナップショットには、タグ `gclue-ai-handson-ami` を、値を AMI の名前にして付けます。
   開催 ID のタグ `handson-deployment` は付けません（付けると、その開催の後片付けの対象と見分けがつかなくなり、ほかの開催でも使う AMI を消してしまうおそれがあるためです。詳しくは [アクセス制御の仕様](<<= guide_link('staff/environment/specs/access-control.md') =>>) の「管理者の作業」）。
   `<説明>` には、入れたソフトウェアを書いておきます。
   表示された `ami-` で始まる値が、新しい AMI の ID です。

   ```bash
   TAGS='ResourceType=image,Tags=[{Key=gclue-ai-handson-ami,Value='
   TAGS+='<AMI の名前>}]'
   TAGS2='ResourceType=snapshot,Tags=[{Key=gclue-ai-handson-ami,'
   TAGS2+='Value=<AMI の名前>}]'

   aws ec2 create-image --instance-id <一時的なインスタンス ID> \
     --name <AMI の名前> --description '<説明>' \
     --tag-specifications "$TAGS" "$TAGS2" --query ImageId \
     --output text
   ```

3. AMI ができるまで待ちます。

   エラーが表示されずにコマンドが終われば、できています（数十分かかることがあります）。
   待ちきれずに時間切れのエラーになった場合は、もう一度実行します。

   ```bash
   aws ec2 wait image-available --image-ids <新しい AMI ID>
   ```

4. AMI の状態を確かめます。

   1 行目に `available` とルートデバイス名、2 行目以降にディスクごとのデバイス名・大きさ（GB）・スナップショット ID が表示されます。
   ルートデバイス名の行の大きさが、設定ファイルの `root_volume_size_gb` 以下であることを確かめます。

   ```bash
   QUERY='Images[0].[[State,RootDeviceName],BlockDeviceMappings[].'
   QUERY+='[DeviceName,Ebs.VolumeSize,Ebs.SnapshotId]]'

   aws ec2 describe-images --image-ids <新しい AMI ID> \
     --query "$QUERY" --output text
   ```

5. 一時的なインスタンスを削除します。

   エラーが表示されずに 2 つ目のコマンドが終われば、削除されています。

   ```bash
   aws ec2 terminate-instances \
     --instance-ids <一時的なインスタンス ID>
   ```

   ```bash
   aws ec2 wait instance-terminated \
     --instance-ids <一時的なインスタンス ID>
   ```

6. 設定ファイルの `aws.handson_cdk.instance.ami_id` に、新しい AMI ID を書きます。

   `root_device_name` は、2.5 で新しい AMI について調べて書きます。

#### 2.4.5 注意

- 元の AMI が AWS Marketplace の製品の場合は、導入済みの AMI にもその製品の情報が引き継がれ、講習会のアカウントでの購読が引き続き必要です（1.1）。
- 導入済みの AMI とそのスナップショットは、保存している間ずっと料金がかかります。
- 導入済みの AMI は別の開催でも使うため、講習会の環境の撤去（7）では削除しません。どの開催でも使わなくなったら、[8. 使わなくなった導入済みの AMI を削除する](<<= guide_link('staff/environment/procedures/environment.md#8-使わなくなった導入済みの-ami-を削除する') =>>) で削除します。
- 構築した後に `ami_id` を変えると、全受講者の EC2 が作り直されます（6 の注意）。作り直すときは、先に [6.1 作り直しの前の準備](<<= guide_link('staff/environment/procedures/environment.md#61-作り直しの前の準備') =>>) をしてください。
