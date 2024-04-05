import * as path from "node:path";
import fse from "fs-extra";
import PackageJson from "@npmcli/package-json";
import exitHook from "exit-hook";

import * as colors from "../colors";
import type { ViteDevOptions } from "../vite/dev";
import type { ViteBuildOptions } from "../vite/build";
import { formatRoutes } from "../config/format";
import type { RoutesFormat } from "../config/format";
import { loadPluginContext } from "../vite/plugin";
import { transpile as convertFileToJS } from "./useJavascript";
import { logger } from "../tux";
import * as profiler from "../vite/profiler";

export async function routes(
  reactRouterRoot?: string,
  flags: {
    config?: string;
    json?: boolean;
  } = {}
): Promise<void> {
  let ctx = await loadPluginContext({
    root: reactRouterRoot,
    configFile: flags.config,
  });

  if (!ctx) {
    console.error(
      colors.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }

  let format: RoutesFormat = flags.json ? "json" : "jsx";
  console.log(formatRoutes(ctx.reactRouterConfig.routes, format));
}

export async function build(
  root?: string,
  options: ViteBuildOptions = {}
): Promise<void> {
  if (!root) {
    root = process.env.REACT_ROUTER_ROOT || process.cwd();
  }

  let { build } = await import("../vite/build");
  if (options.profile) {
    await profiler.start();
  }
  try {
    await build(root, options);
  } finally {
    await profiler.stop(logger.info);
  }
}

export async function dev(root: string, options: ViteDevOptions = {}) {
  let { dev } = await import("../vite/dev");
  if (options.profile) {
    await profiler.start();
  }
  exitHook(() => profiler.stop(console.info));
  await dev(root, options);

  // keep `react-router dev` alive by waiting indefinitely
  await new Promise(() => {});
}

let clientEntries = ["entry.client.tsx", "entry.client.js", "entry.client.jsx"];
let serverEntries = ["entry.server.tsx", "entry.server.js", "entry.server.jsx"];
let entries = ["entry.client", "entry.server"];

let conjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

let disjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});

export async function generateEntry(
  entry: string,
  reactRouterRoot: string,
  flags: {
    typescript?: boolean;
    config?: string;
  } = {}
) {
  let ctx = await loadPluginContext({
    root: reactRouterRoot,
    configFile: flags.config,
  });

  let rootDirectory = ctx.rootDirectory;
  let appDirectory = ctx.reactRouterConfig.appDirectory;

  // if no entry passed, attempt to create both
  if (!entry) {
    await generateEntry("entry.client", reactRouterRoot, flags);
    await generateEntry("entry.server", reactRouterRoot, flags);
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

  let pkgJson = await PackageJson.load(rootDirectory);
  let deps = pkgJson.content.dependencies ?? {};

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

  let defaultsDirectory = path.resolve(__dirname, "..", "config", "defaults");
  let defaultEntryClient = path.resolve(defaultsDirectory, "entry.client.tsx");
  let defaultEntryServer = path.resolve(
    defaultsDirectory,
    ctx?.reactRouterConfig.ssr === false &&
      ctx?.reactRouterConfig.future.unstable_singleFetch !== true
      ? `entry.server.spa.tsx`
      : `entry.server.${serverRuntime}.tsx`
  );

  let isServerEntry = entry === "entry.server";

  let contents = isServerEntry
    ? await createServerEntry(rootDirectory, appDirectory, defaultEntryServer)
    : await createClientEntry(rootDirectory, appDirectory, defaultEntryClient);

  let useTypeScript = flags.typescript ?? true;
  let outputExtension = useTypeScript ? "tsx" : "jsx";
  let outputEntry = `${entry}.${outputExtension}`;
  let outputFile = path.resolve(appDirectory, outputEntry);

  if (!useTypeScript) {
    let javascript = convertFileToJS(contents, {
      cwd: rootDirectory,
      filename: isServerEntry ? defaultEntryServer : defaultEntryClient,
    });
    await fse.writeFile(outputFile, javascript, "utf-8");
  } else {
    await fse.writeFile(outputFile, contents, "utf-8");
  }

  console.log(
    colors.blue(
      `Entry file ${entry} created at ${path.relative(
        rootDirectory,
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
