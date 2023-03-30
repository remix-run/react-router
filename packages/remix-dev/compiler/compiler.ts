import { createChannel } from "../channel";
import type { RemixConfig } from "../config";
import { type Manifest } from "../manifest";
import type { CompileOptions } from "./options";
import * as AssetsCompiler from "./assets";
import * as ServerCompiler from "./server";

type Compiler = {
  compile: () => Promise<Manifest | undefined>;
  dispose: () => void;
};

export let create = async (
  config: RemixConfig,
  options: CompileOptions
): Promise<Compiler> => {
  let channels = {
    manifest: createChannel<Manifest>(),
  };

  let assets = await AssetsCompiler.create(config, options, channels);
  let server = await ServerCompiler.create(config, options, channels);
  return {
    compile: async () => {
      channels.manifest = createChannel();
      try {
        let [manifest] = await Promise.all([
          assets.compile(),
          server.compile(),
        ]);

        return manifest;
      } catch (error: unknown) {
        options.onCompileFailure?.(error as Error);
        return undefined;
      }
    },
    dispose: () => {
      assets.dispose();
      server.dispose();
    },
  };
};
