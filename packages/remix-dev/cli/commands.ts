import * as path from "path";
import { execSync } from "child_process";
import * as fse from "fs-extra";
import ora from "ora";
import prettyMs from "pretty-ms";
import * as esbuild from "esbuild";
import NPMCliPackageJson from "@npmcli/package-json";
import { coerce } from "semver";

import * as colors from "../colors";
import * as compiler from "../compiler";
import * as devServer from "../devServer";
import * as devServer2 from "../devServer2";
import type { RemixConfig } from "../config";
import { readConfig } from "../config";
import { formatRoutes, RoutesFormat, isRoutesFormat } from "../config/format";
import { log } from "../logging";
import { createApp } from "./create";
import { getPreferredPackageManager } from "./getPreferredPackageManager";
import { setupRemix, isSetupPlatform, SetupPlatform } from "./setup";
import runCodemod from "../codemod";
import { CodemodError } from "../codemod/utils/error";
import { TaskError } from "../codemod/utils/task";
import { transpile as convertFileToJS } from "./useJavascript";

export async function create({
  appTemplate,
  projectDir,
  remixVersion,
  installDeps,
  useTypeScript,
  githubToken,
  debug,
}: {
  appTemplate: string;
  projectDir: string;
  remixVersion?: string;
  installDeps: boolean;
  useTypeScript: boolean;
  githubToken?: string;
  debug?: boolean;
}) {
  let spinner = ora("Creating your app…").start();
  await createApp({
    appTemplate,
    projectDir,
    remixVersion,
    installDeps,
    useTypeScript,
    githubToken,
    debug,
  });
  spinner.stop();
  spinner.clear();
}

type InitFlags = {
  deleteScript?: boolean;
};

export async function init(
  projectDir: string,
  { deleteScript = true }: InitFlags = {}
) {
  let initScriptDir = path.join(projectDir, "remix.init");
  let initScriptTs = path.resolve(initScriptDir, "index.ts");
  let initScript = path.resolve(initScriptDir, "index.js");

  if (await fse.pathExists(initScriptTs)) {
    await esbuild.build({
      entryPoints: [initScriptTs],
      format: "cjs",
      platform: "node",
      outfile: initScript,
    });
  }
  if (!(await fse.pathExists(initScript))) {
    return;
  }

  let initPackageJson = path.resolve(initScriptDir, "package.json");
  let isTypeScript = fse.existsSync(path.join(projectDir, "tsconfig.json"));
  let packageManager = getPreferredPackageManager();

  if (await fse.pathExists(initPackageJson)) {
    execSync(`${packageManager} install`, {
      cwd: initScriptDir,
      stdio: "ignore",
    });
  }

  let initFn = require(initScript);
  if (typeof initFn !== "function" && initFn.default) {
    initFn = initFn.default;
  }
  try {
    await initFn({ isTypeScript, packageManager, rootDirectory: projectDir });

    if (deleteScript) {
      await fse.remove(initScriptDir);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      error.message = `${colors.error("🚨 Oops, remix.init failed")}\n\n${
        error.message
      }`;
    }
    throw error;
  }
}

export async function setup(platformArg?: string) {
  let platform: SetupPlatform;
  if (
    platformArg === "cloudflare-workers" ||
    platformArg === "cloudflare-pages"
  ) {
    console.warn(
      `Using '${platformArg}' as a platform value is deprecated. Use ` +
        "'cloudflare' instead."
    );
    console.log("HINT: check the `postinstall` script in `package.json`");
    platform = SetupPlatform.Cloudflare;
  } else {
    platform = isSetupPlatform(platformArg) ? platformArg : SetupPlatform.Node;
  }

  await setupRemix(platform);

  log(`Successfully setup Remix for ${platform}.`);
}

export async function routes(
  remixRoot?: string,
  formatArg?: string
): Promise<void> {
  let config = await readConfig(remixRoot);

  let format = isRoutesFormat(formatArg) ? formatArg : RoutesFormat.jsx;

  console.log(formatRoutes(config.routes, format));
}

export async function build(
  remixRoot: string,
  modeArg?: string,
  sourcemap: boolean = false
): Promise<void> {
  let mode = compiler.parseMode(modeArg ?? "", "production");

  log(`Building Remix app in ${mode} mode...`);

  if (modeArg === "production" && sourcemap) {
    console.warn(
      "\n⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️"
    );
    console.warn(
      "You have enabled source maps in production. This will make your " +
        "server-side code visible to the public and is highly discouraged! If " +
        "you insist, please ensure you are using environment variables for " +
        "secrets and not hard-coding them into your source!"
    );
    console.warn(
      "⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️\n"
    );
  }

  let start = Date.now();
  let config = await readConfig(remixRoot);
  fse.emptyDirSync(config.assetsBuildDirectory);
  await compiler.build(config, {
    mode,
    sourcemap,
    onCompileFailure: (failure) => {
      compiler.logCompileFailure(failure);
      throw Error();
    },
  });

  log(`Built in ${prettyMs(Date.now() - start)}`);
}

export async function watch(
  remixRootOrConfig: string | RemixConfig,
  modeArg?: string
): Promise<void> {
  let mode = compiler.parseMode(modeArg ?? "", "development");
  console.log(`Watching Remix app in ${mode} mode...`);

  let config =
    typeof remixRootOrConfig === "object"
      ? remixRootOrConfig
      : await readConfig(remixRootOrConfig);

  devServer.liveReload(config, {
    mode,
    onInitialBuild: (durationMs) =>
      console.log(`💿 Built in ${prettyMs(durationMs)}`),
  });
  return await new Promise(() => {});
}

export async function dev(
  remixRoot: string,
  modeArg?: string,
  flags: { port?: number; appServerPort?: number } = {}
) {
  let config = await readConfig(remixRoot);
  let mode = compiler.parseMode(modeArg ?? "", "development");

  if (config.future.unstable_dev !== false) {
    await devServer2.serve(config, flags);
    return await new Promise(() => {});
  }

  await devServer.serve(config, mode, flags.port);
  return await new Promise(() => {});
}

export async function codemod(
  codemodName?: string,
  projectDir?: string,
  { dry = false, force = false } = {}
) {
  if (!codemodName) {
    console.error(colors.red("Error: Missing codemod name"));
    console.log(
      "Usage: " +
        colors.gray(
          `remix codemod <${colors.arg("codemod")}> [${colors.arg(
            "projectDir"
          )}]`
        )
    );
    process.exit(1);
  }
  try {
    await runCodemod(projectDir ?? process.cwd(), codemodName, {
      dry,
      force,
    });
  } catch (error: unknown) {
    if (error instanceof CodemodError) {
      console.error(`${colors.red("Error:")} ${error.message}`);
      if (error.additionalInfo) console.info(colors.gray(error.additionalInfo));
      process.exit(1);
    }
    if (error instanceof TaskError) {
      process.exit(1);
    }
    throw error;
  }
}

let clientEntries = ["entry.client.tsx", "entry.client.js", "entry.client.jsx"];
let serverEntries = ["entry.server.tsx", "entry.server.js", "entry.server.jsx"];
let entries = ["entry.client", "entry.server"];

// @ts-expect-error available in node 12+
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat#browser_compatibility
let conjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

// @ts-expect-error available in node 12+
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat#browser_compatibility
let disjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});

export async function generateEntry(
  entry: string,
  remixRoot: string,
  useTypeScript: boolean = true
) {
  let config = await readConfig(remixRoot);

  // if no entry passed, attempt to create both
  if (!entry) {
    await generateEntry("entry.client", remixRoot, useTypeScript);
    await generateEntry("entry.server", remixRoot, useTypeScript);
    return;
  }

  if (!entries.includes(entry)) {
    let entriesArray = Array.from(entries);
    let list = conjunctionListFormat.format(entriesArray);

    console.error(
      colors.error(`Invalid entry file. Valid entry files are ${list}`)
    );
    return;
  }

  let pkgJson = await NPMCliPackageJson.load(config.rootDirectory);
  let deps = pkgJson.content.dependencies ?? {};

  let maybeReactVersion = coerce(deps.react);
  if (!maybeReactVersion) {
    let react = ["react", "react-dom"];
    let list = conjunctionListFormat.format(react);
    throw new Error(
      `Could not determine React version. Please install the following packages: ${list}`
    );
  }

  let type =
    maybeReactVersion.major >= 18 || maybeReactVersion.raw === "0.0.0"
      ? ("stream" as const)
      : ("string" as const);

  let serverRuntime = deps["@remix-run/deno"]
    ? "deno"
    : deps["@remix-run/cloudflare"]
    ? "cloudflare"
    : deps["@remix-run/node"]
    ? "node"
    : undefined;

  if (!serverRuntime) {
    let serverRuntimes = [
      "@remix-run/deno",
      "@remix-run/cloudflare",
      "@remix-run/node",
    ];
    let formattedList = disjunctionListFormat.format(serverRuntimes);
    console.error(
      colors.error(
        `Could not determine server runtime. Please install one of the following: ${formattedList}`
      )
    );
    return;
  }

  let clientRenderer = deps["@remix-run/react"] ? "react" : undefined;

  if (!clientRenderer) {
    console.error(
      colors.error(
        `Could not determine runtime. Please install the following: @remix-run/react`
      )
    );
    return;
  }

  let defaultsDirectory = path.resolve(__dirname, "..", "config", "defaults");
  let defaultEntryClient = path.resolve(
    defaultsDirectory,
    `entry.client.${clientRenderer}-${type}.tsx`
  );
  let defaultEntryServer = path.resolve(
    defaultsDirectory,
    serverRuntime,
    `entry.server.${clientRenderer}-${type}.tsx`
  );

  let isServerEntry = entry === "entry.server";

  let contents = isServerEntry
    ? await createServerEntry(
        config.rootDirectory,
        config.appDirectory,
        defaultEntryServer
      )
    : await createClientEntry(
        config.rootDirectory,
        config.appDirectory,
        defaultEntryClient
      );

  let outputExtension = useTypeScript ? "tsx" : "jsx";
  let outputEntry = `${entry}.${outputExtension}`;
  let outputFile = path.resolve(config.appDirectory, outputEntry);

  if (!useTypeScript) {
    let javascript = convertFileToJS(contents, {
      cwd: config.rootDirectory,
      filename: isServerEntry ? defaultEntryServer : defaultEntryClient,
    });
    await fse.writeFile(outputFile, javascript, "utf-8");
  } else {
    await fse.writeFile(outputFile, contents, "utf-8");
  }

  console.log(
    colors.blue(
      `Entry file ${entry} created at ${path.relative(
        config.rootDirectory,
        outputFile
      )}.`
    )
  );
}

async function checkForEntry(
  rootDirectory: string,
  appDirectory: string,
  entries: string[]
) {
  for (let entry of entries) {
    let entryPath = path.resolve(appDirectory, entry);
    let exists = await fse.pathExists(entryPath);
    if (exists) {
      let relative = path.relative(rootDirectory, entryPath);
      console.error(colors.error(`Entry file ${relative} already exists.`));
      return process.exit(1);
    }
  }
}

async function createServerEntry(
  rootDirectory: string,
  appDirectory: string,
  inputFile: string
) {
  await checkForEntry(rootDirectory, appDirectory, serverEntries);
  let contents = await fse.readFile(inputFile, "utf-8");
  return contents;
}

async function createClientEntry(
  rootDirectory: string,
  appDirectory: string,
  inputFile: string
) {
  await checkForEntry(rootDirectory, appDirectory, clientEntries);
  let contents = await fse.readFile(inputFile, "utf-8");
  return contents;
}
