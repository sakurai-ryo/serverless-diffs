import * as Serverless from "serverless";

import { promises } from "fs";
import { CloudFormation } from "aws-sdk";
import { diffTemplate, formatDifferences } from "@aws-cdk/cloudformation-diff";
import { execSync } from "child_process";

type Template = {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Resources: any;
  Outputs: any;
};

class Plugin {
  public serverless: Serverless;
  public option: Serverless.Options;
  public hooks: {
    [event: string]: Promise<any>;
  };
  public commands: {};
  private cf: CloudFormation;
  private region: string;
  private stage: string;
  private stackName: string;

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.option = options;
    this.region = options.region || this.serverless.service.provider.region;
    this.stage = options.stage || this.serverless.service.provider.stage;
    this.stackName = `${this.serverless.service.service}-${this.stage}`;
    this.cf = new CloudFormation({
      region: this.region,
    });

    this.commands = {
      diffs: {
        usage: "Show Cfn template diffs like SAM or CDK",
        lifecycleEvents: ["diffs"],
        options: {
          profile: {
            required: true,
          },
        },
      },
    };
    this.hooks = {
      "diffs:diffs": this.run.bind(this),
    };
  }

  public async run() {
    const stdout = execSync(
      `sls package --stage ${this.stage} --profile ${this.option.region} --region ${this.region}`
    );
    this.serverless.cli.log(stdout.toString());

    const oldTemp = await this.getOldTemplate(this.stackName);
    const fp = (await this.isFirstDeploy())
      ? "./.serverless/cloudformation-template-create-stack.json"
      : "./.serverless/cloudformation-template-update-stack.json";
    const newTemp = await this.getNewTemplate(fp);
    this.serverless.cli.log(this.stackName);
    this.calcDiffs(oldTemp, newTemp);
  }

  private async isFirstDeploy(): Promise<boolean> {
    const files = await promises.readdir("./.serverless");
    if (files.includes("cloudformation-template-update-stack.json"))
      return false;
    else return true;
  }

  private async getOldTemplate(stackName: string): Promise<Template> {
    const temp = await this.cf
      .getTemplate({
        StackName: stackName,
      })
      .promise();
    return JSON.parse(temp.TemplateBody);
  }

  private async getNewTemplate(path: string): Promise<Template> {
    const temp = await promises.readFile(path, "utf8");
    return JSON.parse(temp);
  }

  private calcDiffs(oldTemp: Template, newTemp: Template) {
    const diffs = diffTemplate(oldTemp, newTemp);
    formatDifferences(process.stdout, diffs);
  }
}

module.exports = Plugin;
