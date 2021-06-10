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
// import * as yesno from "yesno";
const AWS = __importStar(require("aws-sdk"));
const diff = __importStar(require("@aws-cdk/cloudformation-diff"));
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
        this.hooks = {
            // "after:package:createDeploymentArtifacts": this.run.bind(this),
            "before:deploy:deploy": this.run.bind(this),
        };
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const oldTemp = yield this.getOldTemplate();
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
        });
    }
    // private async repl(): Promise<boolean> {
    //   const ok = await yesno({
    //     question: "Dude, Is this groovy or what?",
    //     yesValues: ["Y"],
    //     noValues: ["N"],
    //   });
    //   return ok;
    // }
    isFirstDeploy() {
        const files = fs.readdirSync("./.serverless");
        if (files.includes("cloudformation-template-update-stack.json"))
            return false;
        else
            return true;
    }
    getOldTemplate() {
        return __awaiter(this, void 0, void 0, function* () {
            const temp = yield this.cf
                .getTemplate({
                StackName: this.stackName,
                TemplateStage: "Processed",
            })
                .promise();
            return JSON.parse(temp.TemplateBody);
        });
    }
    getNewTemplate() {
        return JSON.parse(fs.readFileSync("./.serverless/cloudformation-template-update-stack.json", "utf8"));
    }
    calcDiffs(oldTemp, newTemp) {
        const diffs = diff.diffTemplate(oldTemp, newTemp);
        Object.keys(diffs.resources.changes).forEach((key) => {
            Object.keys(diffs.resources.changes[key].propertyUpdates).forEach((k) => {
                console.log(`${key}: `, diffs.resources.changes[key].propertyUpdates[k]);
            });
        });
    }
}
exports.default = Plugin;
module.exports = Plugin;
//# sourceMappingURL=index.js.map