import type { RemixConfig } from "../config";
import type { Logger } from "../tux";
import type { FileWatchCache } from "./fileWatchCache";
import type { Options } from "./options";

export type Context = {
  config: RemixConfig;
  options: Options;
  fileWatchCache: FileWatchCache;
  logger: Logger;
};
