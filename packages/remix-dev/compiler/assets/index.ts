import type { Channel } from "../../channel";
import { createChannel } from "../../channel";
import type { Manifest } from "../../manifest";
import type { Context } from "../context";
import * as CssCompiler from "./css";
import * as JsCompiler from "./js";
import {
  create as createManifest,
  write as writeManifestFile,
} from "./manifest";

export let create = async (
  ctx: Context,
  channels: { manifest: Channel<Manifest> }
) => {
  // setup channels
  let _channels = {
    cssBundleHref: createChannel<string | undefined>(),
  };

  // create subcompilers
  let compiler = {
    css: await CssCompiler.create(ctx, _channels),
    js: await JsCompiler.create(ctx, _channels),
  };

  let compile = async () => {
    // reset channels
    _channels.cssBundleHref = createChannel();

    // parallel builds
    let [css, js] = await Promise.all([
      compiler.css.compile(),
      compiler.js.compile(),
    ]);

    // TODO error handling
    // if (!js.ok || !css.ok) {
    // }

    // manifest
    let manifest = await createManifest({
      config: ctx.config,
      cssBundleHref: css,
      metafile: js.metafile,
      hmr: js.hmr,
    });
    channels.manifest.write(manifest);
    await writeManifestFile(ctx.config, manifest);

    return manifest;
  };
  return {
    compile,
    dispose: () => {
      compiler.css.dispose();
      compiler.js.dispose();
    },
  };
};
