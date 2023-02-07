import { pathToFileURL } from "url";
import loadConfig from "postcss-load-config";
import type { AcceptedPlugin, Processor } from "postcss";
import postcss from "postcss";

import type { RemixConfig } from "../../config";
import { findConfig } from "../../config";

interface Options {
  config: RemixConfig;
  context?: RemixPostcssContext;
}

interface RemixPostcssContext {
  vanillaExtract: boolean;
}

const defaultContext: RemixPostcssContext = {
  vanillaExtract: false,
};

function isPostcssEnabled(config: RemixConfig) {
  return config.future.unstable_postcss || config.future.unstable_tailwind;
}

function getCacheKey({ config, context }: Required<Options>) {
  return [config.rootDirectory, context.vanillaExtract].join("|");
}

let pluginsCache = new Map<string, Array<AcceptedPlugin>>();
export async function loadPostcssPlugins({
  config,
  context = defaultContext,
}: Options): Promise<Array<AcceptedPlugin>> {
  if (!isPostcssEnabled(config)) {
    return [];
  }

  let { rootDirectory } = config;
  let cacheKey = getCacheKey({ config, context });
  let cachedPlugins = pluginsCache.get(cacheKey);
  if (cachedPlugins) {
    return cachedPlugins;
  }

  let plugins: Array<AcceptedPlugin> = [];

  if (config.future.unstable_postcss) {
    try {
      let postcssConfig = await loadConfig(
        // We're nesting our custom context values in a "remix"
        // namespace to avoid clashing with other tools.
        // @ts-expect-error Custom context values aren't type safe.
        { remix: context },
        rootDirectory
      );

      plugins.push(...postcssConfig.plugins);
    } catch (err) {
      // If they don't have a PostCSS config, just ignore it.
    }
  }

  if (config.future.unstable_tailwind) {
    let tailwindPlugin = await loadTailwindPlugin(config);
    if (tailwindPlugin && !hasTailwindPlugin(plugins)) {
      plugins.push(tailwindPlugin);
    }
  }

  pluginsCache.set(cacheKey, plugins);
  return plugins;
}

let processorCache = new Map<string, Processor | null>();
export async function getPostcssProcessor({
  config,
  context = defaultContext,
}: Options): Promise<Processor | null> {
  if (!isPostcssEnabled(config)) {
    return null;
  }

  let cacheKey = getCacheKey({ config, context });
  let cachedProcessor = processorCache.get(cacheKey);
  if (cachedProcessor !== undefined) {
    return cachedProcessor;
  }

  let plugins = await loadPostcssPlugins({ config, context });
  let processor = plugins.length > 0 ? postcss(plugins) : null;

  processorCache.set(cacheKey, processor);
  return processor;
}

function hasTailwindPlugin(plugins: Array<AcceptedPlugin>) {
  return plugins.some(
    (plugin) =>
      "postcssPlugin" in plugin && plugin.postcssPlugin === "tailwindcss"
  );
}

let tailwindPluginCache = new Map<string, AcceptedPlugin | null>();
async function loadTailwindPlugin(
  config: RemixConfig
): Promise<AcceptedPlugin | null> {
  if (!config.future.unstable_tailwind) {
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
    // tailwind doesn't support esm config files yet
    let tailwindConfigExtensions = [".js", ".cjs"];
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
