import * as Serverless from "serverless";

import * as fs from "fs";
import * as AWS from "aws-sdk";
import * as diff from "@aws-cdk/cloudformation-diff";

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
  private cf: AWS.CloudFormation;
  private region: string;
  private stage: string;
  private stackName: string;

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.option = options;
    this.region = options.region || this.serverless.service.provider.region;
    this.stage = options.stage || this.serverless.service.provider.stage;
    this.stackName = `${this.serverless.service.service}-${this.stage}`;
    this.cf = new AWS.CloudFormation({
      region: this.region,
    });

    this.commands = {
      diffs: {
        usage: "Show Cfn template diffs like SAM or CDK",
        lifecycleEvents: ["diffs"],
      },
    };
    this.hooks = {
      "diffs:diffs": this.run.bind(this),
    };
  }

  public async run() {
    const oldTemp = await this.getOldTemplate(this.stackName);
    const newTemp = await this.getNewTemplate(
      "./.serverless/cloudformation-template-update-stack.json"
    );
    this.serverless.cli.log("=== sample log ===");
    this.serverless.cli.log(this.stackName);
    this.calcDiffs(oldTemp, newTemp);
  }

  private isFirstDeploy(): boolean {
    const files = fs.readdirSync("./.serverless");
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
    this.serverless.cli.log(temp.TemplateBody);
    return JSON.parse(temp.TemplateBody);
  }

  private async getNewTemplate(path: string): Promise<Template> {
    const temp = await fs.promises.readFile(path, "utf8");
    this.serverless.cli.log(temp);
    return JSON.parse(temp);
  }

  private calcDiffs(oldTemp: Template, newTemp: Template) {
    const diffs = diff.diffTemplate(oldTemp, newTemp);
    Object.keys(diffs.resources.changes).forEach((key) => {
      Object.keys(diffs.resources.changes[key].propertyUpdates).forEach((k) => {
        console.log(
          `${key}: `,
          diffs.resources.changes[key].propertyUpdates[k]
        );
      });
    });
  }
}

module.exports = Plugin;
