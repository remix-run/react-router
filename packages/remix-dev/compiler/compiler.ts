import * as fs from "node:fs";
import * as path from "node:path";

import type { Context } from "./context";
import * as CSS from "./css";
import * as JS from "./js";
import * as Server from "./server";
import * as Channel from "../channel";
import type { Manifest } from "../manifest";
import { create as createManifest, write as writeManifest } from "./manifest";
import type { LazyValue } from "./lazyValue";
import { createLazyValue } from "./lazyValue";
import { err, ok } from "../result";
import { Cancel } from "./cancel";

type Compiler = {
  compile: (options?: {
    onManifest?: (manifest: Manifest) => void;
  }) => Promise<Manifest>;
  cancel: () => Promise<void>;
  dispose: () => Promise<void>;
};

export let create = async (ctx: Context): Promise<Compiler> => {
  // these variables _should_ be scoped to a build, not a compiler
  // but esbuild doesn't have an API for passing build-specific arguments for rebuilds
  // so instead use a mutable reference (`refs`) that is compiler-scoped
  // and gets reset on each build
  let refs = {
    lazyCssBundleHref: undefined as unknown as LazyValue<string | undefined>,
    manifestChannel: undefined as unknown as Channel.Type<Manifest>,
  };

  let subcompiler = {
    css: await CSS.createCompiler(ctx),
    js: await JS.createCompiler(ctx, refs),
    server: await Server.createCompiler(ctx, refs),
  };
  let cancel = async () => {
    // resolve channels with error so that downstream tasks don't hang waiting for results from upstream tasks
    refs.lazyCssBundleHref.cancel();
    refs.manifestChannel.err();

    // optimization: cancel tasks
    await Promise.all([
      subcompiler.css.cancel(),
      subcompiler.js.cancel(),
      subcompiler.server.cancel(),
    ]);
  };

  let compile = async (
    options: { onManifest?: (manifest: Manifest) => void } = {}
  ) => {
    let error: unknown | undefined = undefined;
    let errCancel = (thrown: unknown) => {
      if (error === undefined) {
        error = thrown;
      }
      void cancel();
      return err(thrown);
    };

    // keep track of manually written artifacts
    let writes: {
      js?: Promise<void>;
      cssBundle?: Promise<void>;
      manifest?: Promise<void>;
      server?: Promise<void>;
    } = {};

    // reset refs for this compilation
    refs.manifestChannel = Channel.create();
    refs.lazyCssBundleHref = createLazyValue({
      async get() {
        let { bundleOutputFile, outputFiles } = await subcompiler.css.compile();

        if (bundleOutputFile) {
          writes.cssBundle = CSS.writeBundle(ctx, outputFiles);
        }

        return (
          bundleOutputFile &&
          ctx.config.publicPath +
            path.relative(
              ctx.config.assetsBuildDirectory,
              path.resolve(bundleOutputFile.path)
            )
        );
      },
      onCancel: ({ reject }) => {
        reject(new Cancel("css-bundle"));
      },
    });

    // kickoff compilations in parallel
    let tasks = {
      js: subcompiler.js.compile().then(ok, errCancel),
      server: subcompiler.server.compile().then(ok, errCancel),
    };

    // js compilation (implicitly writes artifacts/js)
    let js = await tasks.js;
    if (!js.ok) throw error ?? js.error;
    let { metafile, outputFiles, hmr } = js.value;
    writes.js = JS.write(ctx.config, outputFiles);

    // artifacts/manifest
    let manifest = await createManifest({
      config: ctx.config,
      metafile,
      hmr,
      fileWatchCache: ctx.fileWatchCache,
    });
    refs.manifestChannel.ok(manifest);
    options.onManifest?.(manifest);
    writes.manifest = writeManifest(ctx.config, manifest);

    // server compilation
    let server = await tasks.server;
    if (!server.ok) throw error ?? server.error;
    // artifacts/server
    writes.server = Server.write(ctx.config, server.value).then(() => {
      // write the version to a sentinel file _after_ the server has been written
      // this allows the app server to watch for changes to `version.txt`
      // avoiding race conditions when the app server would attempt to reload a partially written server build
      let versionTxt = path.join(
        path.dirname(ctx.config.serverBuildPath),
        "version.txt"
      );
      fs.writeFileSync(versionTxt, manifest.version);
    });

    await Promise.all(Object.values(writes));
    return manifest;
  };
  return {
    compile,
    cancel,
    dispose: async () => {
      await Promise.all(Object.values(subcompiler).map((sub) => sub.dispose()));
    },
  };
};
