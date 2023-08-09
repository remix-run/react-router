import picomatch from "picomatch";
import path from "node:path";

type CacheValue<T> = {
  cacheValue: T;
} & (
  | { fileDependencies?: Set<string>; globDependencies: Set<string> }
  | { fileDependencies: Set<string>; globDependencies?: Set<string> }
);

export interface FileWatchCache {
  get(key: string): Promise<CacheValue<unknown>> | undefined;
  set<T>(key: string, promise: Promise<CacheValue<T>>): Promise<CacheValue<T>>;
  /**
   * #description Get a cache value, or lazily set the value if it doesn't exist
   * and then return the new cache value. This lets you interact with the cache
   * in a single expression.
   */
  getOrSet<T>(
    key: string,
    lazySetter: () => Promise<CacheValue<T>>
  ): Promise<CacheValue<T>>;
  invalidateFile(path: string): void;
}

const globMatchers = new Map<string, ReturnType<typeof picomatch>>();
function getGlobMatcher(glob: string) {
  let matcher = globMatchers.get(glob);

  if (!matcher) {
    matcher = picomatch(normalizeSlashes(glob));
    globMatchers.set(glob, matcher);
  }

  return matcher;
}

export function createFileWatchCache(): FileWatchCache {
  let promiseForCacheKey = new Map<string, Promise<CacheValue<any>>>();

  let fileDepsForCacheKey = new Map<string, Set<string>>();
  let cacheKeysForFileDep = new Map<string, Set<string>>();

  // Glob dependencies are primarily here to support Tailwind.
  // Tailwind directives like `@tailwind utilities` output a bunch of
  // CSS that changes based on the usage of class names in any file matching
  // the globs specified in the `content` array in the Tailwind config, so
  // those globs become a dependency of any CSS file using these directives.
  let globDepsForCacheKey = new Map<string, Set<string>>();
  let cacheKeysForGlobDep = new Map<string, Set<string>>();

  function invalidateCacheKey(invalidatedCacheKey: string): void {
    // If it's not a cache key (or doesn't have a cache entry), bail out
    if (!promiseForCacheKey.has(invalidatedCacheKey)) {
      return;
    }

    promiseForCacheKey.delete(invalidatedCacheKey);

    // Since we keep track of the mapping between cache key and file
    // dependencies, we clear all references to the invalidated cache key.
    // These will be repopulated when "set" or "getOrSet" are called.
    let fileDeps = fileDepsForCacheKey.get(invalidatedCacheKey);
    if (fileDeps) {
      for (let fileDep of fileDeps) {
        cacheKeysForFileDep.get(fileDep)?.delete(invalidatedCacheKey);
      }
      fileDepsForCacheKey.delete(invalidatedCacheKey);
    }

    // Since we keep track of the mapping between cache key and glob
    // dependencies, we clear all references to the invalidated cache key.
    // These will be repopulated when "set" or "getOrSet" are called.
    let globDeps = globDepsForCacheKey.get(invalidatedCacheKey);
    if (globDeps) {
      for (let glob of globDeps) {
        cacheKeysForGlobDep.get(glob)?.delete(invalidatedCacheKey);
      }
      globDepsForCacheKey.delete(invalidatedCacheKey);
    }
  }

  function invalidateFile(invalidatedFile: string): void {
    // Invalidate all cache entries that depend on the file.
    let cacheKeys = cacheKeysForFileDep.get(invalidatedFile);
    if (cacheKeys) {
      for (let cacheKey of cacheKeys) {
        invalidateCacheKey(cacheKey);
      }
    }

    // Invalidate all cache entries that depend on a glob that matches the file.
    // Any glob could match the file, so we have to check all globs.
    for (let [glob, cacheKeys] of cacheKeysForGlobDep) {
      let match = getGlobMatcher(glob);
      if (match && match(normalizeSlashes(invalidatedFile))) {
        for (let cacheKey of cacheKeys) {
          invalidateCacheKey(cacheKey);
        }
      }
    }
  }

  function get<T>(key: string): Promise<CacheValue<T>> | undefined {
    return promiseForCacheKey.get(key);
  }

  function set<T>(
    key: string,
    promise: Promise<CacheValue<T>>
  ): Promise<CacheValue<T>> {
    promiseForCacheKey.set(key, promise);

    void promise
      .catch(() => {
        // Swallow errors to prevent the build from crashing and remove the
        // rejected promise from the cache so consumers can retry
        if (promiseForCacheKey.get(key) === promise) {
          promiseForCacheKey.delete(key);
        }

        return null;
      })
      .then((promiseValue) => {
        // If the promise was rejected, don't attempt to track dependencies
        if (promiseValue === null) {
          return;
        }

        if (promiseForCacheKey.get(key) !== promise) {
          // This cache key was invalidated before the promise resolved
          // so we don't want to track the dependencies.
          return;
        }

        let { fileDependencies, globDependencies } = promiseValue;

        // Track all file dependencies for this entry point so we can invalidate
        // all cache entries that depend on a file that was invalidated.
        if (fileDependencies) {
          let fileDeps = fileDepsForCacheKey.get(key);
          if (!fileDeps) {
            fileDeps = new Set();
            fileDepsForCacheKey.set(key, fileDeps);
          }
          for (let fileDep of fileDependencies) {
            fileDeps.add(fileDep);

            let cacheKeys = cacheKeysForFileDep.get(fileDep);
            if (!cacheKeys) {
              cacheKeys = new Set();
              cacheKeysForFileDep.set(fileDep, cacheKeys);
            }
            cacheKeys.add(key);
          }
        }

        // Track all glob dependencies for this entry point so we can invalidate
        // all cache entries that depend on a glob that matches the invalided file.
        if (globDependencies) {
          let globDeps = globDepsForCacheKey.get(key);
          if (!globDeps) {
            globDeps = new Set();
            globDepsForCacheKey.set(key, globDeps);
          }
          for (let glob of globDependencies) {
            globDeps.add(glob);

            let cacheKeys = cacheKeysForGlobDep.get(glob);
            if (!cacheKeys) {
              cacheKeys = new Set();
              cacheKeysForGlobDep.set(glob, cacheKeys);
            }
            cacheKeys.add(key);
          }
        }
      });

    return promise;
  }

  function getOrSet<T>(
    key: string,
    lazySetter: () => Promise<CacheValue<T>>
  ): Promise<CacheValue<T>> {
    return promiseForCacheKey.get(key) || set(key, lazySetter());
  }

  return {
    get,
    set,
    getOrSet,
    invalidateFile,
  };
}

function normalizeSlashes(file: string) {
  return file.split(path.win32.sep).join("/");
}
