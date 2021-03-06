import * as Serverless from "serverless";

import { promises } from "fs";
import { CloudFormation } from "aws-sdk";
import { diffTemplate, formatDifferences } from "@aws-cdk/cloudformation-diff";
import { spawn } from "child_process";

type Template = {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Resources: any;
  Outputs: any;
};

type Variables = {
  stackName: string;
};

class Plugin {
  public serverless: Serverless;
  public option: Serverless.Options;
  public hooks: {
    [event: string]: Promise<any>;
  };
  public commands: {};
  public variables: Variables;
  private cf: CloudFormation;
  private region: string;
  private stage: string;
  private stackName: string;

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.option = options;
    this.region = options.region || this.serverless.service.provider.region;
    this.stage = options.stage || this.serverless.service.provider.stage;
    this.variables = serverless.service.custom["serverless-diffs"];
    this.stackName = this.variables?.stackName;
    this.cf = new CloudFormation({
      region: this.region,
    });
    this.validateParam();

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
    await this.exec();

    const oldTemp = await this.getOldTemplate(this.stackName);
    const fp = (await this.isFirstDeploy())
      ? "./.serverless/cloudformation-template-create-stack.json"
      : "./.serverless/cloudformation-template-update-stack.json";
    const newTemp = await this.getNewTemplate(fp);
    this.serverless.cli.log(this.stackName);
    this.calcDiffs(oldTemp, newTemp);
  }

  private validateParam() {
    if (!this.variables || !this.variables.stackName)
      throw new Error("Custom Info Is not Provided. Please Add Custom Block.");
  }

  private async exec() {
    return new Promise((resolve, reject) => {
      const res = spawn("sls", [
        "package",
        "--stage",
        this.stage,
        "--profile",
        (this.option as any).profile,
        "--region",
        this.region,
      ]);

      res.on("data", (data) => {
        this.serverless.cli.log(data.toString());
      });
      res.on("close", () => {
        resolve(true);
      });

      res.on("error", (err) => {
        reject(err);
      });
    });
  }

  private async isFirstDeploy(): Promise<boolean> {
    const files = await promises.readdir("./.serverless");
    return files.includes("cloudformation-template-update-stack.json");
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
