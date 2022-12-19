import type { RemixConfig } from "../config";
import { warnOnce } from "./warnings";
import { logCompileFailure } from "./onCompileFailure";
import type { CompileOptions } from "./options";
import { compile, createRemixCompiler } from "./remixCompiler";

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
  let compiler = createRemixCompiler(config, {
    mode,
    target,
    sourcemap,
    onWarning,
    onCompileFailure,
  });
  await compile(compiler, { onCompileFailure });
}
