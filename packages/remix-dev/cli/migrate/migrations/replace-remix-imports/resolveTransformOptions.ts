import type { PackageJson } from "@npmcli/package-json";
import inquirer from "inquirer";

import * as colors from "../../../../colors";
import { depsToEntries, isRemixPackage } from "./dependency";
import { because, detected } from "./messages";
import { remixSetup, remixSetupRuntime } from "./remixSetup";
import type { Adapter } from "./transform/adapter";
import { isAdapter } from "./transform/adapter";
import type { Options } from "./transform/options";
import type { Runtime } from "./transform/runtime";
import { runtimes, isRuntime } from "./transform/runtime";

const adapterToRuntime: Record<Adapter, Runtime> = {
  architect: "node",
  "cloudflare-pages": "cloudflare",
  "cloudflare-workers": "cloudflare",
  express: "node",
  netlify: "node",
  vercel: "node",
};

const autoDetectPostinstallRuntime = (
  packageJson: PackageJson
): Runtime | undefined => {
  let postinstall = packageJson.scripts?.postinstall;
  if (postinstall === undefined) return undefined;
  if (postinstall.match(remixSetup) === null) return undefined;

  // match `remix setup <runtime>` in `postinstall` script
  let runtimeMatch = postinstall.match(remixSetupRuntime);
  if (runtimeMatch === null) return "node";
  let runtime = runtimeMatch[1];
  if (isRuntime(runtime)) return runtime;
  console.warn(
    `️⚠️  You have \`${runtime}\` in your \`postinstall\` script, but \`${runtime}\` is not a valid Remix server runtime.`
  );
  return undefined;
};

const detectedRuntime = (runtime: Runtime) => {
  let runtimePackage = colors.blue(`@remix-run/${runtime}`);
  return detected(`\`${runtimePackage}\` as your Remix server runtime`);
};

const resolveRuntime = async (
  packageJson: PackageJson,
  adapter?: Adapter
): Promise<Runtime> => {
  // match `remix setup <runtime>` in `postinstall` script
  let postinstallRuntime = autoDetectPostinstallRuntime(packageJson);
  if (postinstallRuntime) {
    console.log(detectedRuntime(postinstallRuntime));
    console.log(
      because(
        `you had \`remix setup ${postinstallRuntime}\` in your \`postinstall\` script.`
      )
    );
    return postinstallRuntime;
  }

  // infer runtime from adapter
  if (adapter) {
    let runtime = adapterToRuntime[adapter];
    console.log(detectedRuntime(runtime));
    let adapterPackage = colors.blue(`@remix-run/${adapter}`);
    console.log(because(`you have \`${adapterPackage}\` installed.`));
    return runtime;
  }

  // @remix-run/serve uses node
  let deps = depsToEntries(packageJson.dependencies);
  let remixDeps = deps.filter(({ name }) => isRemixPackage(name));
  if (remixDeps.map(({ name }) => name).includes("@remix-run/serve")) {
    let runtime = "node" as const;
    console.log(detectedRuntime(runtime));
    console.log(because("you have `@remix-run/serve` installed."));
    return runtime;
  }

  console.log("🕵️  I couldn't infer your Remix server runtime.");
  // otherwise, ask user for runtime
  let { runtime } = await inquirer.prompt<{ runtime?: Runtime }>([
    {
      name: "runtime",
      message: "Which server runtime is this project using?",
      type: "list",
      pageSize: runtimes.length + 1,
      choices: [...runtimes, { name: "Nevermind...", value: undefined }],
    },
  ]);
  if (runtime === undefined) process.exit(0);
  return runtime;
};

const resolveAdapter = (packageJson: PackageJson): Adapter | undefined => {
  // find adapter in package.json dependencies
  let deps = depsToEntries(packageJson.dependencies);
  let remixDeps = deps.filter(({ name }) => isRemixPackage(name));
  let adapters = remixDeps
    .map(({ name }) => name.replace(/^@remix-run\//, ""))
    .filter(isAdapter);

  if (adapters.length > 1) {
    console.error(
      "❌ I found more than one Remix server adapter your in dependencies:"
    );
    console.log(
      adapters.map((adapter) => `   - @remix-run/${adapter}`).join("\n")
    );
    console.log("👉 Uninstall unused adapters and try again.");
    process.exit(1);
  }

  if (adapters.length === 1) {
    let adapter = adapters[0];
    let adapterPackage = colors.blue(`@remix-run/${adapter}`);
    console.log(detected(`\`${adapterPackage}\` as your Remix server adapter`));
    console.log(because("it's in your dependencies."));
    return adapter;
  }

  return undefined;
};

export const resolveTransformOptions = async (
  packageJson: PackageJson
): Promise<Options> => {
  let adapter = resolveAdapter(packageJson);
  return {
    adapter,
    runtime: await resolveRuntime(packageJson, adapter),
  };
};
