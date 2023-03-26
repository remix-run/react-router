import type { RemixConfig } from "../config";
import { type Manifest } from "../manifest";
import {
  create as createManifest,
  write as writeManifest,
} from "./utils/manifest";
import * as BrowserJS from "./browserjs";
import * as ServerJS from "./serverjs";
import type { CompileOptions } from "./options";
import type { Channel } from "../channel";
import { createChannel } from "../channel";
import * as CSS from "./css";

type Compiler = {
  compile: () => Promise<Manifest | undefined>;
  dispose: () => void;
};

export let create = (
  config: RemixConfig,
  options: CompileOptions
): Compiler => {
  let cssBundleHrefChannel: Channel<string | undefined>;
  let writeCssBundleHref = (cssBundleHref?: string) =>
    cssBundleHrefChannel.write(cssBundleHref);
  let readCssBundleHref = () => cssBundleHrefChannel.read();
  let css = CSS.compiler.create(config, options, writeCssBundleHref);
  let browser = BrowserJS.compiler.create(config, options, readCssBundleHref);
  let server = ServerJS.compiler.create(config, options);
  return {
    compile: async () => {
      // TODO: only reset cssBundleHrefChannel if css bundling is enabled?
      // otherwise we could just write `undefined` to the channel immediately
      cssBundleHrefChannel = createChannel();
      try {
        let [cssBundleHref, { metafile, hmr }] = await Promise.all([
          css.compile(),
          browser.compile(),
        ]);
        let manifest = await createManifest({
          config,
          metafile: metafile,
          cssBundleHref,
          hmr,
        });
        await Promise.all([
          server.compile(manifest),
          writeManifest(config, manifest),
        ]);

        return manifest;
      } catch (error: unknown) {
        options.onCompileFailure?.(error as Error);
        return undefined;
      }
    },
    dispose: () => {
      css.dispose();
      browser.dispose();
      server.dispose();
    },
  };
};
