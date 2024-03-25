import { cac } from "cac";

function convertHost(v: any) {
  if (typeof v === "number") {
    return String(v);
  }
  return v;
}

export async function run(argv: string[] = process.argv.slice(2)) {
  const cli = cac("rr");

  cli
    .command("vite:dev [root]", "build for production")
    .option(
      "--clearScreen",
      "Allow/disable clear screen when logging (boolean)"
    )
    .option("-c, --config <file>", "Use specified config file (string)")
    .option("--cors", "Enable CORS (boolean)")
    .option(
      "--force",
      "Force the optimizer to ignore the cache and re-bundle (boolean)"
    )
    .option("--host [host]", "Specify hostname (string)", {
      type: [convertHost],
    })
    .option("-l, --logLevel <level>", "Info | warn | error | silent (string)")
    .option("-m, --mode <mode>", "Set env mode (string)")
    .option("--open", "Open browser on startup (boolean | string)")
    .option("--port <port>", "Specify port (number)")
    .option("--profile", "Start built-in Node.js inspector")
    .option(
      "--strictPort",
      "Exit if specified port is already in use (boolean)"
    )
    .action(async (root: string, options) => {
      console.log("vite:dev options", options);
    });

  cli
    .command("vite:build [root]", "build for production")
    .option(
      "--assetsInlineLimit <number>",
      "Static asset base64 inline threshold in bytes (default: 4096) (number)"
    )
    .option(
      "--clearScreen",
      "Allow/disable clear screen when logging (boolean)"
    )
    .option("-c, --config <file>", "Use specified config file (string)")
    .option(
      "--emptyOutDir",
      "Force empty outDir when it's outside of root (boolean)"
    )
    .option("-l, --logLevel <level>", "Info | warn | error | silent (string)")
    .option(
      "--minify [minifier]",
      'Enable/disable minification, or specify minifier to use (default: "esbuild") (boolean | "terser" | "esbuild")'
    )
    .option("-m, --mode <mode>", "Set env mode (string)")
    .option("--profile", "Start built-in Node.js inspector")
    .option(
      "--sourcemapClient [output]",
      'Output source maps for client build (default: false) (boolean | "inline" | "hidden")'
    )
    .option(
      "--sourcemapServer [output]",
      'Output source maps for server build (default: false) (boolean | "inline" | "hidden")'
    )
    .action(async (root: string, options) => {
      console.log("vite:build options", options);
    });

  cli.version(require("../package.json").version);

  cli.help();

  cli.parse(["node", "rr", ...argv]);
}
