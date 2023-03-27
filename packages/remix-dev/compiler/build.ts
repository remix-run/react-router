import type { RemixConfig } from "../config";
import { warnOnce } from "../warnOnce";
import { logCompileFailure } from "./onCompileFailure";
import type { CompileOptions } from "./options";
import * as Compiler from "./compiler";

export async function build(
  config: RemixConfig,
  {
    mode = "production",
    target = "node14",
    sourcemap = false,
    onWarning = warnOnce,
    onCompileFailure = logCompileFailure,
  }: Partial<CompileOptions> = {}
): Promise<void> {
  let compiler = await Compiler.create(config, {
    mode,
    target,
    sourcemap,
    onWarning,
    onCompileFailure,
  });
  await compiler.compile();
}
