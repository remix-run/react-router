import arg from "arg";
import semver from "semver";

/**
 * Parse command line arguments for `react-router` dev CLI
 */
export function parseArgs(argv: string[] = process.argv.slice(2)) {
  // Check the node version
  let versions = process.versions;
  let MINIMUM_NODE_VERSION = 20;
  if (
    versions &&
    versions.node &&
    semver.major(versions.node) < MINIMUM_NODE_VERSION
  ) {
    console.warn(
      `️⚠️ Oops, Node v${versions.node} detected. react-router requires ` +
        `a Node version greater than ${MINIMUM_NODE_VERSION}.`
    );
  }

  let isBooleanFlag = (arg: string) => {
    let index = argv.indexOf(arg);
    let nextArg = argv[index + 1];
    return !nextArg || nextArg.startsWith("-");
  };

  let args = arg(
    {
      "--force": Boolean,
      "--help": Boolean,
      "-h": "--help",
      "--json": Boolean,
      "--token": String,
      "--typescript": Boolean,
      "--no-typescript": Boolean,
      "--version": Boolean,
      "-v": "--version",
      "--port": Number,
      "-p": "--port",
      "--config": String,
      "-c": "--config",
      "--assetsInlineLimit": Number,
      "--clearScreen": Boolean,
      "--cors": Boolean,
      "--emptyOutDir": Boolean,
      "--host": isBooleanFlag("--host") ? Boolean : String,
      "--logLevel": String,
      "-l": "--logLevel",
      "--minify": String,
      "--mode": String,
      "-m": "--mode",
      "--open": isBooleanFlag("--open") ? Boolean : String,
      "--strictPort": Boolean,
      "--profile": Boolean,
      "--sourcemapClient": isBooleanFlag("--sourcemapClient")
        ? Boolean
        : String,
      "--sourcemapServer": isBooleanFlag("--sourcemapServer")
        ? Boolean
        : String,
      "--watch": Boolean,
    },
    {
      argv,
    }
  );

  let flags: any = Object.entries(args).reduce((acc, [key, value]) => {
    key = key.replace(/^--/, "");
    acc[key] = value;
    return acc;
  }, {} as any);

  flags.interactive = flags.interactive ?? require.main === module;
  if (args["--no-typescript"]) {
    flags.typescript = false;
  }

  return {
    input: args._,
    command: args._[0],
    flags,
  };
}
