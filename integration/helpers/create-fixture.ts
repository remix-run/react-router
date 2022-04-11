import path from "path";
import fse from "fs-extra";
import type { Writable } from "stream";
import express from "express";
import getPort from "get-port";
import stripIndent from "strip-indent";
import chalk from "chalk";
import { sync as spawnSync } from "cross-spawn";

import type { ServerBuild } from "../../build/node_modules/@remix-run/server-runtime";
import { createRequestHandler } from "../../build/node_modules/@remix-run/server-runtime";
import { createRequestHandler as createExpressHandler } from "../../build/node_modules/@remix-run/express";

const TMP_DIR = path.join(process.cwd(), ".tmp", "integration");

interface FixtureInit {
  buildStdio?: Writable;
  sourcemap?: boolean;
  files: { [filename: string]: string };
  template?: "cf-template" | "node-template";
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;
export type AppFixture = Awaited<ReturnType<typeof createAppFixture>>;

export const js = String.raw;
export const json = String.raw;
export const mdx = String.raw;
export const css = String.raw;

export async function createFixture(init: FixtureInit) {
  let projectDir = await createFixtureProject(init);
  let buildPath = path.resolve(projectDir, "build");
  if (!fse.existsSync(buildPath)) {
    throw new Error(
      chalk.red(
        `Expected build directory to exist at ${chalk.dim(
          buildPath
        )}. The build probably failed. Did you maybe have a syntax error in your test code strings?`
      )
    );
  }
  let app: ServerBuild = await import(buildPath);
  let handler = createRequestHandler(app, "production");

  let requestDocument = async (href: string, init?: RequestInit) => {
    let url = new URL(href, "test://test");
    let request = new Request(url.toString(), init);
    return handler(request);
  };

  let requestData = async (
    href: string,
    routeId: string,
    init?: RequestInit
  ) => {
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

export async function createAppFixture(fixture: Fixture) {
  let startAppServer = async (): Promise<{
    port: number;
    stop: () => Promise<void>;
  }> => {
    return new Promise(async (accept) => {
      let port = await getPort();
      let app = express();
      app.use(express.static(path.join(fixture.projectDir, "public")));
      app.all(
        "*",
        createExpressHandler({ build: fixture.build, mode: "production" })
      );

      let server = app.listen(port);

      let stop = (): Promise<void> => {
        return new Promise((res) => {
          server.close(() => res());
        });
      };

      accept({ stop, port });
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
       * `beforeAll` block. Also make sure to `await app.close()` or else you'll
       * have memory leaks.
       */
      close: async () => {
        return stop();
      },
    };
  };

  return start();
}

////////////////////////////////////////////////////////////////////////////////
export async function createFixtureProject(init: FixtureInit): Promise<string> {
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
  await writeTestFiles(init, projectDir);
  build(projectDir, init.buildStdio, init.sourcemap);

  return projectDir;
}

function build(projectDir: string, buildStdio?: Writable, sourcemap?: boolean) {
  let buildArgs = ["node_modules/@remix-run/dev/cli.js", "build"];
  if (sourcemap) {
    buildArgs.push("--sourcemap");
  }
  let buildSpawn = spawnSync("node", buildArgs, {
    cwd: projectDir,
  });
  if (buildStdio) {
    buildStdio.write(buildSpawn.stdout.toString("utf-8"));
    buildStdio.write(buildSpawn.stderr.toString("utf-8"));
    buildStdio.end();
  }
}

async function writeTestFiles(init: FixtureInit, dir: string) {
  await Promise.all(
    Object.keys(init.files).map(async (filename) => {
      let filePath = path.join(dir, filename);
      await fse.ensureDir(path.dirname(filePath));
      await fse.writeFile(filePath, stripIndent(init.files[filename]));
    })
  );
}
