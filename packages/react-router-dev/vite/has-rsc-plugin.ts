import * as Vite from "vite";

export async function hasReactRouterRscPlugin({
  root,
  viteBuildOptions: { config, logLevel, mode },
}: {
  root: string;
  viteBuildOptions: {
    config?: string;
    logLevel?: Vite.LogLevel;
    mode?: string;
  };
}): Promise<boolean> {
  const viteConfig = await Vite.resolveConfig(
    {
      configFile: config,
      logLevel,
      mode: mode ?? "production",
      root,
    },
    "build", // command
    "production", // default mode
    "production", // default NODE_ENV
  );
  return viteConfig.plugins.some(
    (plugin) => plugin?.name === "react-router/rsc",
  );
}
