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
const readline = require("readline");
class Plugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.option = options;
        this.hooks = {
            // tsconfig.jsonで "compilerOptions.strictBindCallApply == false" にしないと、トランスパイル時にここでエラーが起きる
            "before:package:createDeploymentArtifacts": this.run.bind(this),
        };
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const repl = () => __awaiter(this, void 0, void 0, function* () {
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
            });
            yield repl();
            this.serverless.cli.log("=== sample log ===");
        });
    }
}
exports.default = Plugin;
module.exports = Plugin;
//# sourceMappingURL=index.js.map