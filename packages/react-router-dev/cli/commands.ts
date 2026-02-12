import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import exitHook from "exit-hook";
import colors from "picocolors";
// Workaround for "ERR_REQUIRE_CYCLE_MODULE" in Node 22.10.0+
import "react-router";

import type { ViteDevOptions } from "../vite/dev";
import type { ViteBuildOptions } from "../vite/build";
import { loadConfig } from "../config/config";
import { formatRoutes } from "../config/format";
import type { RoutesFormat } from "../config/format";
import { transpile as convertFileToJS } from "./useJavascript";
import * as profiler from "../vite/profiler";
import * as Typegen from "../typegen";
import { preloadVite, getVite } from "../vite/vite";
import { hasReactRouterRscPlugin } from "../vite/has-rsc-plugin";

export async function routes(
  rootDirectory?: string,
  flags: {
    config?: string;
    json?: boolean;
    mode?: string;
  } = {},
): Promise<void> {
  rootDirectory = resolveRootDirectory(rootDirectory, flags);
  let configResult = await loadConfig({
    rootDirectory,
    mode: flags.mode ?? "production",
  });

  if (!configResult.ok) {
    console.error(colors.red(configResult.error));
    process.exit(1);
  }

  let format: RoutesFormat = flags.json ? "json" : "jsx";
  console.log(formatRoutes(configResult.value.routes, format));
}

export async function build(
  root?: string,
  options: ViteBuildOptions = {},
): Promise<void> {
  root = resolveRootDirectory(root, options);

  let { build } = await import("../vite/build");
  if (options.profile) {
    await profiler.start();
  }
  try {
    await build(root, options);
  } finally {
    await profiler.stop(console.info);
  }
}

export async function dev(root?: string, options: ViteDevOptions = {}) {
  let { dev } = await import("../vite/dev");
  if (options.profile) {
    await profiler.start();
  }
  exitHook(() => profiler.stop(console.info));

  root = resolveRootDirectory(root, options);
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

export async function generateEntry(
  entry?: string,
  rootDirectory?: string,
  flags: {
    typescript?: boolean;
    config?: string;
    mode?: string;
  } = {},
) {
  rootDirectory = resolveRootDirectory(rootDirectory, flags);

  if (
    await hasReactRouterRscPlugin({
      root: rootDirectory,
      viteBuildOptions: {
        config: flags.config,
        mode: flags.mode,
      },
    })
  ) {
    console.error(
      colors.red(
        `The reveal command is currently not supported in RSC Framework Mode.`,
      ),
    );
    process.exit(1);
  }

  // if no entry passed, attempt to create both
  if (!entry) {
    await generateEntry("entry.client", rootDirectory, flags);
    await generateEntry("entry.server", rootDirectory, flags);
    return;
  }

  let configResult = await loadConfig({
    rootDirectory,
    mode: flags.mode ?? "production",
  });

  if (!configResult.ok) {
    console.error(colors.red(configResult.error));
    return;
  }

  let appDirectory = configResult.value.appDirectory;

  if (!entries.includes(entry)) {
    let entriesArray = Array.from(entries);
    let list = conjunctionListFormat.format(entriesArray);

    console.error(
      colors.red(`Invalid entry file. Valid entry files are ${list}`),
    );
    return;
  }

  // TODO(v8): Remove - only required for Node 20.18 and below
  let { readPackageJSON } = await import("pkg-types");
  let pkgJson = await readPackageJSON(rootDirectory);
  let deps = pkgJson.dependencies ?? {};

  let defaultsDirectory = path.resolve(
    path.dirname(require.resolve("@react-router/dev/package.json")),
    "dist",
    "config",
    "defaults",
  );
  let defaultEntryClient = path.resolve(defaultsDirectory, "entry.client.tsx");

  let defaultEntryServer = path.resolve(
    defaultsDirectory,
    deps["@react-router/node"]
      ? `entry.server.node.tsx`
      : `entry.server.web.tsx`,
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
    let javascript = await convertFileToJS(contents, {
      cwd: rootDirectory,
      filename: isServerEntry ? defaultEntryServer : defaultEntryClient,
    });
    await writeFile(outputFile, javascript, "utf-8");
  } else {
    await writeFile(outputFile, contents, "utf-8");
  }

  console.log(
    colors.blue(
      `Entry file ${entry} created at ${path.relative(
        rootDirectory,
        outputFile,
      )}.`,
    ),
  );
}

function resolveRootDirectory(root?: string, flags?: { config?: string }) {
  if (root) {
    return path.resolve(root);
  }

  return (
    process.env.REACT_ROUTER_ROOT ||
    (flags?.config ? path.dirname(path.resolve(flags.config)) : process.cwd())
  );
}

async function checkForEntry(
  rootDirectory: string,
  appDirectory: string,
  entries: string[],
) {
  for (let entry of entries) {
    let entryPath = path.resolve(appDirectory, entry);
    let exists = existsSync(entryPath);
    if (exists) {
      let relative = path.relative(rootDirectory, entryPath);
      console.error(colors.red(`Entry file ${relative} already exists.`));
      return process.exit(1);
    }
  }
}

async function createServerEntry(
  rootDirectory: string,
  appDirectory: string,
  inputFile: string,
) {
  await checkForEntry(rootDirectory, appDirectory, serverEntries);
  let contents = await readFile(inputFile, "utf-8");
  return contents;
}

async function createClientEntry(
  rootDirectory: string,
  appDirectory: string,
  inputFile: string,
) {
  await checkForEntry(rootDirectory, appDirectory, clientEntries);
  let contents = await readFile(inputFile, "utf-8");
  return contents;
}

export async function typegen(
  root: string,
  flags: {
    watch: boolean;
    mode?: string;
    config?: string;
  },
) {
  root = resolveRootDirectory(root, flags);

  const rsc = await hasReactRouterRscPlugin({
    root,
    viteBuildOptions: {
      config: flags.config,
      mode: flags.mode,
    },
  });

  if (flags.watch) {
    await preloadVite();
    const vite = getVite();
    const logger = vite.createLogger("info", { prefix: "[react-router]" });

    await Typegen.watch(root, {
      mode: flags.mode ?? "development",
      rsc,
      logger,
    });
    await new Promise(() => {}); // keep alive
    return;
  }

  await Typegen.run(root, {
    mode: flags.mode ?? "production",
    rsc,
  });
}
