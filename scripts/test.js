import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const dirname = path.dirname(fileURLToPath(import.meta.url));

let args = process.argv.slice(2);

let targetPackage = args.find((arg) => !arg.startsWith("-"));
let allPackages = fs.readdirSync(path.resolve(dirname, "../packages"));

let jestArgs = ["--projects"];

if (targetPackage && allPackages.includes(targetPackage)) {
  jestArgs.push(`packages/${targetPackage}`);
} else {
  jestArgs.push(`packages/*`);
}

if (args.includes("--watch")) {
  jestArgs.push("--watch");
}

if (args.includes("-u")) {
  jestArgs.push("-u");
}

execSync(`jest ${jestArgs.join(" ")}`, {
  env: process.env,
  stdio: "inherit",
});
