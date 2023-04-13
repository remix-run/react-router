import * as Compiler from "./compiler";
import type { Context } from "./context";

export async function build(ctx: Context): Promise<void> {
  let compiler = await Compiler.create(ctx);
  await compiler.compile();
}
