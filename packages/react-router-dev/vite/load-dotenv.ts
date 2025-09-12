import type * as Vite from "vite";

export async function loadDotenv({
  rootDirectory,
  viteUserConfig,
  mode,
}: {
  rootDirectory: string;
  viteUserConfig: Vite.UserConfig;
  mode: string;
}) {
  const vite = await import("vite");
  Object.assign(
    process.env,
    vite.loadEnv(
      mode,
      viteUserConfig.envDir ?? rootDirectory,
      // We override the default prefix of "VITE_" with a blank string since
      // we're targeting the server, so we want to load all environment
      // variables, not just those explicitly marked for the client
      "",
    ),
  );
}
