import type { Writable } from "node:stream";
import path from "node:path";
import fse from "fs-extra";
import express from "express";
import getPort from "get-port";
import dedent from "dedent";
import stripIndent from "strip-indent";
import serializeJavaScript from "serialize-javascript";
import { sync as spawnSync } from "cross-spawn";
import type { JsonObject } from "type-fest";
import type { AppConfig } from "@remix-run/dev";
import { ServerMode } from "@remix-run/server-runtime/mode";

import type { ServerBuild } from "../../build/node_modules/@remix-run/server-runtime";
import { createRequestHandler } from "../../build/node_modules/@remix-run/server-runtime";
import { createRequestHandler as createExpressHandler } from "../../build/node_modules/@remix-run/express";

const TMP_DIR = path.join(process.cwd(), ".tmp", "integration");

export interface FixtureInit {
  buildStdio?: Writable;
  sourcemap?: boolean;
  files?: { [filename: string]: string };
  template?: "cf-template" | "deno-template" | "node-template";
  setup?: "node" | "cloudflare";
  config?: Partial<AppConfig>;
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
export type AppFixture = Awaited<ReturnType<typeof createAppFixture>>;

export const js = String.raw;
export const mdx = String.raw;
export const css = String.raw;
export function json(value: JsonObject) {
  return JSON.stringify(value, null, 2);
}

export async function createFixture(init: FixtureInit, mode?: ServerMode) {
  let projectDir = await createFixtureProject(init, mode);
  let buildPath = path.resolve(projectDir, "build");
  let app: ServerBuild = await import(buildPath);
  let handler = createRequestHandler(app, mode || ServerMode.Production);

  let requestDocument = async (href: string, init?: RequestInit) => {
    let url = new URL(href, "test://test");
    let request = new Request(url.toString(), {
      ...init,
      signal: init?.signal || new AbortController().signal,
    });
    return handler(request);
  };

  let requestData = async (
    href: string,
    routeId: string,
    init?: RequestInit
  ) => {
    init = init || {};
    init.signal = init.signal || new AbortController().signal;
    let url = new URL(href, "test://test");
    url.searchParams.set("_data", routeId);
    let request = new Request(url.toString(), init);
    return handler(request);
  };

  let postDocument = async (href: string, data: URLSearchParams | FormData) => {
    return requestDocument(href, {
      method: "POST",
      body: data,
      headers: {
        "Content-Type":
          data instanceof URLSearchParams
            ? "application/x-www-form-urlencoded"
            : "multipart/form-data",
      },
    });
  };

  let getBrowserAsset = async (asset: string) => {
    return fse.readFile(
      path.join(projectDir, "public", asset.replace(/^\//, "")),
      "utf8"
    );
  };

  return {
    projectDir,
    build: app,
    requestDocument,
    requestData,
    postDocument,
    getBrowserAsset,
  };
}

export async function createAppFixture(fixture: Fixture, mode?: ServerMode) {
  let startAppServer = async (): Promise<{
    port: number;
    stop: VoidFunction;
  }> => {
    return new Promise(async (accept) => {
      let port = await getPort();
      let app = express();
      app.use(express.static(path.join(fixture.projectDir, "public")));

      app.all(
        "*",
        createExpressHandler({
          build: fixture.build,
          mode: mode || ServerMode.Production,
        })
      );

      let server = app.listen(port);

      accept({ stop: server.close.bind(server), port });
    });
  };

  let start = async () => {
    let { stop, port } = await startAppServer();

    let serverUrl = `http://localhost:${port}`;

    return {
      serverUrl,
      /**
       * Shuts down the fixture app, **you need to call this
       * at the end of a test** or `afterAll` if the fixture is initialized in a
       * `beforeAll` block. Also make sure to `app.close()` or else you'll
       * have memory leaks.
       */
      close: () => {
        return stop();
      },
    };
  };

  return start();
}

////////////////////////////////////////////////////////////////////////////////

export async function createFixtureProject(
  init: FixtureInit = {},
  mode?: ServerMode
): Promise<string> {
  let template = init.template ?? "node-template";
  let integrationTemplateDir = path.join(__dirname, template);
  let projectName = `remix-${template}-${Math.random().toString(32).slice(2)}`;
  let projectDir = path.join(TMP_DIR, projectName);

  await fse.ensureDir(projectDir);
  await fse.copy(integrationTemplateDir, projectDir);
  await fse.copy(
    path.join(__dirname, "../../build/node_modules"),
    path.join(projectDir, "node_modules"),
    { overwrite: true }
  );

  if (init.setup) {
    let setupSpawn = spawnSync(
      "node",
      ["node_modules/@remix-run/dev/dist/cli.js", "setup", init.setup],
      { cwd: projectDir }
    );

    // These logs are helpful for debugging. Remove comments if needed.
    // console.log("spawning @remix-run/dev/cli.js `setup`:\n");
    // console.log("  STDOUT:");
    // console.log("  " + setupSpawn.stdout.toString("utf-8"));
    // console.log("  STDERR:");
    // console.log("  " + setupSpawn.stderr.toString("utf-8"));
    if (setupSpawn.error || setupSpawn.status) {
      console.error(setupSpawn.stderr.toString("utf-8"));
      throw (
        setupSpawn.error || new Error(`Setup failed, check the output above`)
      );
    }
  }

  await writeTestFiles(init, projectDir);

  // We update the config file *after* writing test files so that tests can provide a custom
  // `remix.config.js` file while still supporting the type-checked `config`
  // property on the fixture object. This is useful for config values that can't
  // be serialized, e.g. usage of imported functions within `remix.config.js`.
  let contents = fse.readFileSync(
    path.join(projectDir, "remix.config.js"),
    "utf-8"
  );
  if (
    init.config &&
    !contents.includes("global.INJECTED_FIXTURE_REMIX_CONFIG")
  ) {
    throw new Error(dedent`
      Cannot provide a \`config\` fixture option and a \`remix.config.js\` file
      at the same time, unless the \`remix.config.js\` file contains a reference
      to the \`global.INJECTED_FIXTURE_REMIX_CONFIG\` placeholder so it can
      accept the injected config values. Either move all config values into
      \`remix.config.js\` file, or spread the  injected config, 
      e.g. \`module.exports = { ...global.INJECTED_FIXTURE_REMIX_CONFIG }\`.
    `);
  }
  contents = contents.replace(
    "global.INJECTED_FIXTURE_REMIX_CONFIG",
    `${serializeJavaScript(init.config ?? {})}`
  );
  fse.writeFileSync(path.join(projectDir, "remix.config.js"), contents);

  build(projectDir, init.buildStdio, init.sourcemap, mode);

  return projectDir;
}

function build(
  projectDir: string,
  buildStdio?: Writable,
  sourcemap?: boolean,
  mode?: ServerMode
) {
  let buildArgs = ["node_modules/@remix-run/dev/dist/cli.js", "build"];
  if (sourcemap) {
    buildArgs.push("--sourcemap");
  }

  let buildSpawn = spawnSync("node", buildArgs, {
    cwd: projectDir,
    env: {
      ...process.env,
      NODE_ENV: mode || ServerMode.Production,
    },
  });

  // These logs are helpful for debugging. Remove comments if needed.
  // console.log("spawning @remix-run/dev/cli.js `build`:\n");
  // console.log("  STDOUT:");
  // console.log("  " + buildSpawn.stdout.toString("utf-8"));
  // console.log("  STDERR:");
  // console.log("  " + buildSpawn.stderr.toString("utf-8"));

  if (buildStdio) {
    buildStdio.write(buildSpawn.stdout.toString("utf-8"));
    buildStdio.write(buildSpawn.stderr.toString("utf-8"));
    buildStdio.end();
  }

  if (buildSpawn.error || buildSpawn.status) {
    console.error(buildSpawn.stderr.toString("utf-8"));
    throw buildSpawn.error || new Error(`Build failed, check the output above`);
  }
}

async function writeTestFiles(init: FixtureInit, dir: string) {
  await Promise.all(
    Object.keys(init.files ?? {}).map(async (filename) => {
      let filePath = path.join(dir, filename);
      await fse.ensureDir(path.dirname(filePath));
      let file = init.files![filename];
      // if we have a jsconfig we don't want the tsconfig to exist
      if (filename.endsWith("jsconfig.json")) {
        let parsed = path.parse(filePath);
        await fse.remove(path.join(parsed.dir, "tsconfig.json"));
      }

      await fse.writeFile(filePath, stripIndent(file));
    })
  );
}
