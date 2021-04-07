import * as Serverless from "serverless";

import * as readline from "readline";

export default class Plugin {
  public serverless: Serverless;
  public option: Serverless.Options;
  public hooks: {
    [event: string]: Promise<any>;
  };

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.option = options;

    this.hooks = {
      "before:package:createDeploymentArtifacts": this.run.bind(this),
    };
  }

  public async run() {
    await this.repl();
    this.serverless.cli.log("=== sample log ===");
  }

  private async repl() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question("Please enter names for your project: ", (answer) => {
        console.log(`Thank you!! Let's start ${answer}`);
        rl.close();
        resolve();
      });
    });
  }
}

module.exports = Plugin;
