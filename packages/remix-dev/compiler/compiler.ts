import { createChannel } from "../channel";
import { type Manifest } from "../manifest";
import * as AssetsCompiler from "./assets";
import type { Context } from "./context";
import * as ServerCompiler from "./server";

type Compiler = {
  compile: () => Promise<Manifest | undefined>;
  dispose: () => void;
};

export let create = async (ctx: Context): Promise<Compiler> => {
  let channels = {
    manifest: createChannel<Manifest>(),
  };

  let assets = await AssetsCompiler.create(ctx, channels);
  let server = await ServerCompiler.create(ctx, channels);
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
        ctx.options.onCompileFailure?.(error as Error);
        return undefined;
      }
    },
    dispose: () => {
      assets.dispose();
      server.dispose();
    },
  };
};
