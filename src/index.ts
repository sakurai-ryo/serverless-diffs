import * as Serverless from "serverless";

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
      // tsconfig.jsonで "compilerOptions.strictBindCallApply == false" にしないと、トランスパイル時にここでエラーが起きる
      "before:package:createDeploymentArtifacts": this.run.bind(this),
    };
  }

  public async run() {
    this.serverless.cli.log("=== sample log ===");
  }
}

module.exports = Plugin;
