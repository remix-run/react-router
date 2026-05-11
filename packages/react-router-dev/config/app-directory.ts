import { AsyncLocalStorage } from "node:async_hooks";

import invariant from "../invariant";

declare global {
  var __reactRouterAppDirectory: string;
}

const appDirectoryStorage = new AsyncLocalStorage<string>();

export function setAppDirectory(directory: string) {
  globalThis.__reactRouterAppDirectory = directory;
}

export function getAppDirectory() {
  const appDirectory =
    appDirectoryStorage.getStore() ?? globalThis.__reactRouterAppDirectory;
  invariant(appDirectory);
  return appDirectory;
}

export function withAppDirectory<T>(directory: string, callback: () => T): T {
  return appDirectoryStorage.run(directory, callback);
}
