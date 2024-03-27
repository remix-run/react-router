import path from "node:path";
import { pathToFileURL } from "node:url";
import fse from "fs-extra";
import loadConfig from "postcss-load-config";
import type { AcceptedPlugin, Message, Processor } from "postcss";
import postcss from "postcss";

import type { RemixConfig } from "../../config";
import type { Options } from "../options";
import type { FileWatchCache } from "../fileWatchCache";
import { findConfig } from "../../config";

interface PostcssContext {
  vanillaExtract: boolean;
}

const defaultPostcssContext: PostcssContext = {
  vanillaExtract: false,
};

function isPostcssEnabled(config: RemixConfig) {
  return config.postcss || config.tailwind;
}

function getCacheKey({
  config,
  postcssContext,
}: {
  config: RemixConfig;
  postcssContext: PostcssContext;
}) {
  return [config.rootDirectory, postcssContext.vanillaExtract].join("|");
}

let pluginsCache = new Map<string, Array<AcceptedPlugin>>();
export async function loadPostcssPlugins({
  config,
  postcssContext = defaultPostcssContext,
}: {
  config: RemixConfig;
  postcssContext?: PostcssContext;
}): Promise<Array<AcceptedPlugin>> {
  if (!isPostcssEnabled(config)) {
    return [];
  }

  let { rootDirectory } = config;
  let cacheKey = getCacheKey({ config, postcssContext });
  let cachedPlugins = pluginsCache.get(cacheKey);
  if (cachedPlugins) {
    return cachedPlugins;
  }

  let plugins: Array<AcceptedPlugin> = [];

  if (config.postcss) {
    try {
      let postcssConfig = await loadConfig(
        // We're nesting our custom context values in a "remix"
        // namespace to avoid clashing with other tools.
        { remix: postcssContext } as loadConfig.ConfigContext, // Custom config extensions aren't type safe
        rootDirectory
      );

      plugins.push(...postcssConfig.plugins);
    } catch (err) {
      // If they don't have a PostCSS config, just ignore it,
      // otherwise rethrow the error.
      if (
        err instanceof Error &&
        !/No PostCSS Config found/i.test(err.message)
      ) {
        throw err;
      }
    }
  }

  if (config.tailwind) {
    let tailwindPlugin = await loadTailwindPlugin(config);
    if (tailwindPlugin && !hasTailwindPlugin(plugins, tailwindPlugin)) {
      plugins.push(tailwindPlugin);
    }
  }

  pluginsCache.set(cacheKey, plugins);
  return plugins;
}

let processorCache = new Map<string, Processor | null>();
export async function getPostcssProcessor({
  config,
  postcssContext = defaultPostcssContext,
}: {
  config: RemixConfig;
  postcssContext?: PostcssContext;
}): Promise<Processor | null> {
  if (!isPostcssEnabled(config)) {
    return null;
  }

  let cacheKey = getCacheKey({ config, postcssContext });
  let cachedProcessor = processorCache.get(cacheKey);
  if (cachedProcessor !== undefined) {
    return cachedProcessor;
  }

  let plugins = await loadPostcssPlugins({ config, postcssContext });
  let processor = plugins.length > 0 ? postcss(plugins) : null;

  processorCache.set(cacheKey, processor);
  return processor;
}

function hasTailwindPlugin(
  plugins: Array<AcceptedPlugin>,
  tailwindPlugin: AcceptedPlugin
) {
  return plugins.some(
    (plugin) =>
      plugin === tailwindPlugin ||
      (typeof plugin === "function" && plugin.name === "tailwindcss") ||
      ("postcssPlugin" in plugin && plugin.postcssPlugin === "tailwindcss")
  );
}

let tailwindPluginCache = new Map<string, AcceptedPlugin | null>();
async function loadTailwindPlugin(
  config: RemixConfig
): Promise<AcceptedPlugin | null> {
  if (!config.tailwind) {
    return null;
  }

  let { rootDirectory } = config;
  let cacheKey = rootDirectory;
  let cachedTailwindPlugin = tailwindPluginCache.get(cacheKey);
  if (cachedTailwindPlugin !== undefined) {
    return cachedTailwindPlugin;
  }

  let tailwindPath: string | null = null;

  try {
    // First ensure they have a Tailwind config
    let tailwindConfigExtensions = [".js", ".cjs", ".mjs", ".ts"];
    let tailwindConfig = findConfig(
      rootDirectory,
      "tailwind.config",
      tailwindConfigExtensions
    );
    if (!tailwindConfig) throw new Error("No Tailwind config found");

    // Load Tailwind from the project directory
    tailwindPath = require.resolve("tailwindcss", { paths: [rootDirectory] });
  } catch {
    // If they don't have a Tailwind config or Tailwind installed, just ignore it.
    return null;
  }

  let importedTailwindPlugin = tailwindPath
    ? (await import(pathToFileURL(tailwindPath).href))?.default
    : null;

  let tailwindPlugin: AcceptedPlugin | null =
    importedTailwindPlugin && importedTailwindPlugin.postcss // Check that it declares itself as a PostCSS plugin
      ? importedTailwindPlugin
      : null;

  tailwindPluginCache.set(cacheKey, tailwindPlugin);

  return tailwindPlugin;
}

// PostCSS plugin result objects can contain arbitrary messages returned
// from plugins. Here we look for messages that indicate a dependency
// on another file or glob. Here we target the generic dependency messages
// returned from 'postcss-import' and 'tailwindcss' plugins, but we may
// need to add more in the future depending on what other plugins do.
// More info:
// - https://postcss.org/docs/postcss-runner-guidelines
// - https://postcss.org/api/#result
// - https://postcss.org/api/#message
export function populateDependenciesFromMessages({
  messages,
  fileDependencies,
  globDependencies,
}: {
  messages: Array<Message>;
  fileDependencies: Set<string>;
  globDependencies: Set<string>;
}): void {
  for (let message of messages) {
    if (message.type === "dependency" && typeof message.file === "string") {
      fileDependencies.add(message.file);
      continue;
    }

    if (
      message.type === "dir-dependency" &&
      typeof message.dir === "string" &&
      typeof message.glob === "string"
    ) {
      globDependencies.add(path.join(message.dir, message.glob));
      continue;
    }
  }
}

export async function getCachedPostcssProcessor({
  config,
  options,
  fileWatchCache,
}: {
  config: RemixConfig;
  options: Options;
  fileWatchCache: FileWatchCache;
}) {
  // eslint-disable-next-line prefer-let/prefer-let -- Avoid needing to repeatedly check for null since const can't be reassigned
  const postcssProcessor = await getPostcssProcessor({ config });

  if (!postcssProcessor) {
    return null;
  }

  return async function processCss(args: { path: string }) {
    let cacheKey = `postcss:${args.path}?sourcemap=${options.sourcemap}`;

    let { cacheValue } = await fileWatchCache.getOrSet(cacheKey, async () => {
      let contents = await fse.readFile(args.path, "utf-8");

      let { css, messages } = await postcssProcessor.process(contents, {
        from: args.path,
        to: args.path,
        map: options.sourcemap,
      });

      let fileDependencies = new Set<string>();
      let globDependencies = new Set<string>();

      // Ensure the CSS file being passed to PostCSS is tracked as a
      // dependency of this cache key since a change to this file should
      // invalidate the cache, not just its sub-dependencies.
      fileDependencies.add(args.path);

      populateDependenciesFromMessages({
        messages,
        fileDependencies,
        globDependencies,
      });

      return {
        cacheValue: css,
        fileDependencies,
        globDependencies,
      };
    });

    return cacheValue;
  };
}
