import * as Serverless from "serverless";

import * as fs from "fs";
// import * as yesno from "yesno";
import * as AWS from "aws-sdk";
import * as diff from "@aws-cdk/cloudformation-diff";

type Template = {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Resources: any;
  Outputs: any;
};

export default class Plugin {
  public serverless: Serverless;
  public option: Serverless.Options;
  public hooks: {
    [event: string]: Promise<any>;
  };
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

    this.hooks = {
      // "after:package:createDeploymentArtifacts": this.run.bind(this),
      "before:deploy:deploy": this.run.bind(this),
    };
  }

  public async run() {
    const oldTemp = await this.getOldTemplate();
    const newTemp = this.getNewTemplate();
    this.serverless.cli.log("=== sample log ===");
    console.log("Stack: ", this.stackName);
    const structDatas = [
      {
        handler: "http",
        endpoint: "http://localhost:3000/path",
        method: "ALL",
      },
      {
        handler: "event",
        endpoint: "http://localhost:3000/event",
        method: "POST",
      },
      { handler: "GCS", endpoint: "http://localhost:3000/GCS", method: "POST" },
    ];
    console.table(structDatas);
    this.calcDiffs(oldTemp, newTemp);
  }

  // private async repl(): Promise<boolean> {
  //   const ok = await yesno({
  //     question: "Dude, Is this groovy or what?",
  //     yesValues: ["Y"],
  //     noValues: ["N"],
  //   });
  //   return ok;
  // }

  private isFirstDeploy(): boolean {
    const files = fs.readdirSync("./.serverless");
    if (files.includes("cloudformation-template-update-stack.json"))
      return false;
    else return true;
  }

  private async getOldTemplate(): Promise<Template> {
    const temp = await this.cf
      .getTemplate({
        StackName: this.stackName,
        TemplateStage: "Processed",
      })
      .promise();
    return JSON.parse(temp.TemplateBody);
  }

  private getNewTemplate(): Template {
    return JSON.parse(
      fs.readFileSync(
        "./.serverless/cloudformation-template-update-stack.json",
        "utf8"
      )
    );
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
