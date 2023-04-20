import * as path from "path";

import type { Context } from "./context";
import * as CSS from "./css";
import * as JS from "./js";
import * as Server from "./server";
import * as Channel from "../channel";
import type { Manifest } from "../manifest";
import { create as createManifest, write as writeManifest } from "./manifest";

type Compiler = {
  compile: () => Promise<Manifest>;
  cancel: () => Promise<void>;
  dispose: () => Promise<void>;
};

export let create = async (ctx: Context): Promise<Compiler> => {
  // channels _should_ be scoped to a build, not a compiler
  // but esbuild doesn't have an API for passing build-specific arguments for rebuilds
  // so instead use a mutable reference (`channels`) that is compiler-scoped
  // and gets reset on each build
  let channels = {
    cssBundleHref: undefined as unknown as Channel.Type<string | undefined>,
    manifest: undefined as unknown as Channel.Type<Manifest>,
  };

  let subcompiler = {
    css: await CSS.createCompiler(ctx),
    js: await JS.createCompiler(ctx, channels),
    server: await Server.createCompiler(ctx, channels),
  };

  let compile = async () => {
    let hasThrown = false;
    let cancelAndThrow = async (error: unknown) => {
      // An earlier error from a failed task has already been thrown; ignore this error.
      // Safe to cast as `never` here as subsequent errors are only thrown from canceled tasks.
      if (hasThrown) return undefined as never;

      // resolve channels with error so that downstream tasks don't hang waiting for results from upstream tasks
      channels.cssBundleHref.err();
      channels.manifest.err();

      // optimization: cancel tasks
      subcompiler.css.cancel();
      subcompiler.js.cancel();
      subcompiler.server.cancel();

      // Only throw the first error encountered during compilation
      // otherwise subsequent errors will be unhandled and will crash the compiler.
      // `try`/`catch` won't handle subsequent errors either, so that isn't a viable alternative.
      // `Promise.all` _could_ be used, but the resulting promise chaining is complex and hard to follow.
      hasThrown = true;
      throw error;
    };

    // reset channels
    channels.cssBundleHref = Channel.create();
    channels.manifest = Channel.create();

    // kickoff compilations in parallel
    let tasks = {
      css: subcompiler.css.compile().catch(cancelAndThrow),
      js: subcompiler.js.compile().catch(cancelAndThrow),
      server: subcompiler.server.compile().catch(cancelAndThrow),
    };

    // keep track of manually written artifacts
    let writes: {
      cssBundle?: Promise<void>;
      manifest?: Promise<void>;
      server?: Promise<void>;
    } = {};

    // css compilation
    let css = await tasks.css;

    // css bundle
    let cssBundleHref =
      css.bundle &&
      ctx.config.publicPath +
        path.relative(
          ctx.config.assetsBuildDirectory,
          path.resolve(css.bundle.path)
        );
    channels.cssBundleHref.ok(cssBundleHref);
    if (css.bundle) {
      writes.cssBundle = CSS.writeBundle(ctx, css.outputFiles);
    }

    // js compilation (implicitly writes artifacts/js)
    // TODO: js task should not return metafile, but rather js assets
    let { metafile, hmr } = await tasks.js;

    // artifacts/manifest
    let manifest = await createManifest({
      config: ctx.config,
      cssBundleHref,
      metafile,
      hmr,
    });
    channels.manifest.ok(manifest);
    writes.manifest = writeManifest(ctx.config, manifest);

    // server compilation
    let serverFiles = await tasks.server;
    // artifacts/server
    writes.server = Server.write(ctx.config, serverFiles);

    await Promise.all(Object.values(writes));
    return manifest;
  };
  return {
    compile,
    cancel: async () => {
      await Promise.all(Object.values(subcompiler).map((sub) => sub.cancel()));
    },
    dispose: async () => {
      await Promise.all(Object.values(subcompiler).map((sub) => sub.dispose()));
    },
  };
};
