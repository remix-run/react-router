import * as path from "path";
import { execSync } from "child_process";
import inspector from "inspector";
import * as fse from "fs-extra";
import getPort, { makeRange } from "get-port";
import ora from "ora";
import prettyMs from "pretty-ms";
import * as esbuild from "esbuild";
import NPMCliPackageJson from "@npmcli/package-json";
import { coerce } from "semver";
import pc from "picocolors";

import * as colors from "../colors";
import * as compiler from "../compiler";
import * as devServer from "../devServer";
import * as devServer_unstable from "../devServer_unstable";
import type { RemixConfig } from "../config";
import { readConfig } from "../config";
import { formatRoutes, RoutesFormat, isRoutesFormat } from "../config/format";
import { createApp } from "./create";
import { detectPackageManager } from "./detectPackageManager";
import { setupRemix, isSetupPlatform, SetupPlatform } from "./setup";
import runCodemod from "../codemod";
import { CodemodError } from "../codemod/utils/error";
import { TaskError } from "../codemod/utils/task";
import { transpile as convertFileToJS } from "./useJavascript";
import type { Options } from "../compiler/options";
import { createFileWatchCache } from "../compiler/fileWatchCache";
import { logger } from "../tux";

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
  let packageManager = detectPackageManager() ?? "npm";

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

  console.log(`Successfully setup Remix for ${platform}.`);
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
  let mode = parseMode(modeArg) ?? "production";

  logger.info(`building...` + pc.gray(` (NODE_ENV=${mode})`));

  if (modeArg === "production" && sourcemap) {
    logger.warn("🚨  source maps enabled in production", {
      details: [
        "You are using `--sourcemap` to enable source maps in production,",
        "making your server-side code publicly visible in the browser.",
        "This is highly discouraged!",
        "If you insist, ensure that you are using environment variables for secrets",
        "and are not hard-coding them in your source.",
      ],
    });
  }

  let start = Date.now();
  let config = await readConfig(remixRoot);
  let options: Options = {
    mode,
    sourcemap,
  };
  if (mode === "development" && config.future.v2_dev) {
    let resolved = await resolveDev(config);
    options.REMIX_DEV_ORIGIN = resolved.REMIX_DEV_ORIGIN;
  }

  let fileWatchCache = createFileWatchCache();

  fse.emptyDirSync(config.assetsBuildDirectory);
  await compiler
    .build({ config, options, fileWatchCache, logger })
    .catch((thrown) => {
      compiler.logThrown(thrown);
      process.exit(1);
    });

  logger.info("built" + pc.gray(` (${prettyMs(Date.now() - start)})`));
}

// TODO: replace watch in v2
export async function watch(
  remixRootOrConfig: string | RemixConfig,
  modeArg?: string
): Promise<void> {
  let mode = parseMode(modeArg) ?? "development";
  console.log(`Watching Remix app in ${mode} mode...`);

  let config =
    typeof remixRootOrConfig === "object"
      ? remixRootOrConfig
      : await readConfig(remixRootOrConfig);

  devServer.liveReload(config);
  return await new Promise(() => {});
}

export async function dev(
  remixRoot: string,
  flags: {
    debug?: boolean;

    // v2_dev
    command?: string;
    manual?: boolean;
    port?: number;
    tlsKey?: string;
    tlsCert?: string;
    scheme?: string; // TODO: remove in v2
    host?: string; // TODO: remove in v2
    restart?: boolean; // TODO: remove in v2
  } = {}
) {
  console.log(`\n 💿  remix dev\n`);

  if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") {
    logger.warn(`overriding NODE_ENV=${process.env.NODE_ENV} to development`);
  }
  process.env.NODE_ENV = "development";
  if (flags.debug) inspector.open();

  let config = await readConfig(remixRoot);

  if (config.future.v2_dev === false) {
    logger.warn("The `remix dev` changing in v2", {
      details: [
        "You can use the `v2_dev` future flag to opt-in early.",
        "-> https://remix.run/docs/en/main/pages/v2#dev-server",
      ],
    });
    await devServer.serve(config, flags.port);
    return await new Promise(() => {});
  }

  let resolved = await resolveDevServe(config, flags);
  await devServer_unstable.serve(config, resolved);
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

let parseMode = (
  mode?: string
): compiler.CompileOptions["mode"] | undefined => {
  if (mode === undefined) return undefined;
  if (mode === "development") return mode;
  if (mode === "production") return mode;
  if (mode === "test") return mode;
  console.error(`Unrecognized mode: ${mode}`);
  process.exit(1);
};

let findPort = async () => getPort({ port: makeRange(3001, 3100) });

let resolveDev = async (
  config: RemixConfig,
  flags: {
    port?: number;
    tlsKey?: string;
    tlsCert?: string;
    /** @deprecated */
    scheme?: string; // TODO: remove in v2
    /** @deprecated */
    host?: string; // TODO: remove in v2
  } = {}
) => {
  let dev = config.future.v2_dev;
  if (dev === false) throw Error("This should never happen");

  // prettier-ignore
  let port =
    flags.port ??
    (dev === true ? undefined : dev.port) ??
    (await findPort());

  let tlsKey = flags.tlsKey ?? (dev === true ? undefined : dev.tlsKey);
  if (tlsKey) tlsKey = path.resolve(tlsKey);
  let tlsCert = flags.tlsCert ?? (dev === true ? undefined : dev.tlsCert);
  if (tlsCert) tlsCert = path.resolve(tlsCert);
  let isTLS = tlsKey && tlsCert;

  let REMIX_DEV_ORIGIN = process.env.REMIX_DEV_ORIGIN;
  if (REMIX_DEV_ORIGIN === undefined) {
    // prettier-ignore
    let scheme =
      flags.scheme ?? // TODO: remove in v2
      (dev === true ? undefined : dev.scheme) ?? // TODO: remove in v2
      isTLS ? "https" : "http";
    // prettier-ignore
    let hostname =
      flags.host ?? // TODO: remove in v2
      (dev === true ? undefined : dev.host) ?? // TODO: remove in v2
      "localhost";
    REMIX_DEV_ORIGIN = `${scheme}://${hostname}:${port}`;
  }

  return {
    port,
    tlsKey,
    tlsCert,
    REMIX_DEV_ORIGIN: new URL(REMIX_DEV_ORIGIN),
  };
};

let resolveDevServe = async (
  config: RemixConfig,
  flags: {
    command?: string;
    manual?: boolean;
    port?: number;
    tlsKey?: string;
    tlsCert?: string;
    scheme?: string; // TODO: remove in v2
    host?: string; // TODO: remove in v2
    restart?: boolean; // TODO: remove in v2
  } = {}
) => {
  let dev = config.future.v2_dev;
  if (dev === false) throw Error("Cannot resolve dev options");

  let resolved = await resolveDev(config, flags);

  // prettier-ignore
  let command =
    flags.command ??
    (dev === true ? undefined : dev.command)

  // TODO: remove in v2
  let restart = dev === true ? undefined : dev.restart;
  if (restart !== undefined) {
    logger.warn("The `v2_dev.restart` option is deprecated", {
      details: [
        "Use `v2_dev.manual` instead.",
        "-> https://remix.run/docs/en/main/guides/development-performance#manual-mode",
      ],
    });
  }

  // prettier-ignore
  let manual =
    flags.manual ??
    (dev === true ? undefined : dev.manual) ??
    restart !== undefined ? !restart : // TODO: remove in v2
    false;

  return {
    ...resolved,
    command,
    manual,
  };
};
