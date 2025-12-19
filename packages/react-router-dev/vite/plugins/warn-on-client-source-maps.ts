import type * as Vite from "vite";
import colors from "picocolors";
import invariant from "../../invariant";

export function warnOnClientSourceMaps(): Vite.Plugin {
  let viteConfig: Vite.ResolvedConfig;
  let viteCommand: Vite.ConfigEnv["command"];
  let logged = false;

  return {
    name: "react-router:warn-on-client-source-maps",
    config(_, configEnv) {
      viteCommand = configEnv.command;
    },
    configResolved(config) {
      viteConfig = config;
    },
    buildStart() {
      invariant(viteConfig);

      if (
        !logged &&
        viteCommand === "build" &&
        viteConfig.mode === "production" &&
        !viteConfig.build.ssr &&
        (viteConfig.build.sourcemap ||
          viteConfig.environments?.client?.build.sourcemap)
      ) {
        viteConfig.logger.warn(
          colors.yellow(
            "\n" +
              colors.bold("  ⚠️  Source maps are enabled in production\n") +
              [
                "This makes your server code publicly",
                "visible in the browser. This is highly",
                "discouraged! If you insist, ensure that",
                "you are using environment variables for",
                "secrets and not hard-coding them in",
                "your source code.",
              ]
                .map((line) => "     " + line)
                .join("\n") +
              "\n",
          ),
        );
        logged = true;
      }
    },
  };
}
