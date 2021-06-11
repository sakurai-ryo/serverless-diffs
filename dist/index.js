"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const AWS = __importStar(require("aws-sdk"));
const diff = __importStar(require("@aws-cdk/cloudformation-diff"));
const child_process_1 = require("child_process");
class Plugin {
    constructor(serverless, options) {
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
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const stdout = child_process_1.execSync("sls package");
            this.serverless.cli.log(stdout.toString());
            const oldTemp = yield this.getOldTemplate(this.stackName);
            const fp = this.isFirstDeploy()
                ? "./.serverless/cloudformation-template-create-stack.json"
                : "./.serverless/cloudformation-template-update-stack.json";
            const newTemp = yield this.getNewTemplate(fp);
            this.serverless.cli.log(this.stackName);
            this.calcDiffs(oldTemp, newTemp);
        });
    }
    isFirstDeploy() {
        const files = fs.readdirSync("./.serverless");
        if (files.includes("cloudformation-template-update-stack.json"))
            return false;
        else
            return true;
    }
    getOldTemplate(stackName) {
        return __awaiter(this, void 0, void 0, function* () {
            const temp = yield this.cf
                .getTemplate({
                StackName: stackName,
            })
                .promise();
            return JSON.parse(temp.TemplateBody);
        });
    }
    getNewTemplate(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const temp = yield fs.promises.readFile(path, "utf8");
            return JSON.parse(temp);
        });
    }
    calcDiffs(oldTemp, newTemp) {
        const diffs = diff.diffTemplate(oldTemp, newTemp);
        diff.formatDifferences(process.stdout, diffs);
    }
}
module.exports = Plugin;
//# sourceMappingURL=index.js.map