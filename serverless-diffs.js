"use strict";
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
const fs_1 = require("fs");
const aws_sdk_1 = require("aws-sdk");
const cloudformation_diff_1 = require("@aws-cdk/cloudformation-diff");
const child_process_1 = require("child_process");
class Plugin {
    constructor(serverless, options) {
        var _a;
        this.serverless = serverless;
        this.option = options;
        this.region = options.region || this.serverless.service.provider.region;
        this.stage = options.stage || this.serverless.service.provider.stage;
        this.variables = serverless.service.custom["serverless-diffs"];
        this.stackName = (_a = this.variables) === null || _a === void 0 ? void 0 : _a.stackName;
        this.cf = new aws_sdk_1.CloudFormation({
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
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec();
            const oldTemp = yield this.getOldTemplate(this.stackName);
            const fp = (yield this.isFirstDeploy())
                ? "./.serverless/cloudformation-template-create-stack.json"
                : "./.serverless/cloudformation-template-update-stack.json";
            const newTemp = yield this.getNewTemplate(fp);
            this.serverless.cli.log(this.stackName);
            this.calcDiffs(oldTemp, newTemp);
        });
    }
    validateParam() {
        if (!this.variables || !this.variables.stackName)
            throw new Error("Custom Info Is not Provided. Please Add Custom Block.");
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const res = child_process_1.spawn("sls", [
                    "package",
                    "--stage",
                    this.stage,
                    "--profile",
                    this.option.profile,
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
        });
    }
    isFirstDeploy() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield fs_1.promises.readdir("./.serverless");
            if (files.includes("cloudformation-template-update-stack.json"))
                return false;
            else
                return true;
        });
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
            const temp = yield fs_1.promises.readFile(path, "utf8");
            return JSON.parse(temp);
        });
    }
    calcDiffs(oldTemp, newTemp) {
        const diffs = cloudformation_diff_1.diffTemplate(oldTemp, newTemp);
        cloudformation_diff_1.formatDifferences(process.stdout, diffs);
    }
}
module.exports = Plugin;
//# sourceMappingURL=serverless-diffs.js.map