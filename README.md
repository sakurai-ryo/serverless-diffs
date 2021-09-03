# Serverless Diffs
Show Cfn template diffs like SAM or CDK For AWS

# Configuration
- Required: add Custom bnlock to your serverless.yml
```yaml
service: test

custom:
    serverless-diffs:
        stackName: (your stack name)

provider:
  name: aws
  runtime: nodejs10.x
  region: ap-northeast-1

plugins:
    - (path to plugin)

functions:
  hello:
    handler: handler.hello
    timeout: 20
```

# Command
```shell
# in serverless dir
serverless diffs --profile ${your aws profile} --region ${your region}
```