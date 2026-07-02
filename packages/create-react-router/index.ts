import process from "node:process";
import { spawn, type StdioOptions } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readFile, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, stripVTControlCharacters } from "node:util";
import * as semver from "semver";
import sortPackageJSON from "sort-package-json";

import { prompt } from "./prompt";
import {
  IGNORED_TEMPLATE_DIRECTORIES,
  color,
  debug,
  ensureDirectory,
  error,
  getDirectoryFilesRecursive,
  info,
  isInteractive,
  isValidJsonObject,
  log,
  sleep,
  strip,
  stripDirectoryFromPath,
  toValidProjectName,
} from "./utils";
import { renderLoadingIndicator } from "./loading-indicator";
import { copyTemplate, CopyTemplateError } from "./copy-template";
import pkgJson from "./package.json" with { type: "json" };

const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir =
  path.basename(currentFileDir) === "dist"
    ? path.dirname(currentFileDir)
    : currentFileDir;
const agentSkillPath = path.join(packageDir, "dist/agent-skills/react-router");

async function createReactRouter(argv: string[]) {
  let ctx = await getContext(argv);
  if (ctx.help) {
    printHelp(ctx);
    return;
  }
  if (ctx.versionRequested) {
    log(pkgJson.version);
    return;
  }

  let steps = [
    introStep,
    projectNameStep,
    copyTemplateToTempDirStep,
    copyTempDirToAppDirStep,
    gitInitQuestionStep,
    installDependenciesQuestionStep,
    agentSkillsQuestionStep,
    copyAgentSkillsToAppDirStep,
    installDependenciesStep,
    gitInitStep,
    doneStep,
  ];

  try {
    for (let step of steps) {
      await step(ctx);
    }
  } catch (err) {
    if (ctx.debug) {
      console.error(err);
    }
    throw err;
  }
}

async function getContext(argv: string[]): Promise<Context> {
  let { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    // Preserve arg's permissive mode so unknown flags don't fail existing usage.
    strict: false,
    options: {
      "agent-skills": { type: "boolean" },
      debug: { type: "boolean" },
      "git-init": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      install: { type: "boolean" },
      "no-agent-skills": { type: "boolean" },
      "no-color": { type: "boolean" },
      "no-git-init": { type: "boolean" },
      "no-install": { type: "boolean" },
      "no-motion": { type: "boolean" },
      overwrite: { type: "boolean" },
      "package-manager": { type: "string" },
      "react-router-version": { type: "string", short: "v" },
      "show-install-output": { type: "boolean" },
      template: { type: "string" },
      token: { type: "string" },
      version: { type: "boolean", short: "V" },
      yes: { type: "boolean", short: "y" },
    },
  });

  let getBooleanArg = (
    value: string | boolean | Array<string | boolean> | undefined,
  ) => (typeof value === "boolean" ? value : undefined);
  let getStringArg = (
    value: string | boolean | Array<string | boolean> | undefined,
  ) => (typeof value === "string" ? value : undefined);

  let selectedReactRouterVersion = getStringArg(values["react-router-version"]);
  let yes = getBooleanArg(values.yes);
  let cwd = positionals[0] as string;
  let interactive = isInteractive();
  let projectName = cwd;

  if (!interactive) {
    yes = true;
  }

  if (selectedReactRouterVersion) {
    if (semver.valid(selectedReactRouterVersion)) {
      // do nothing, we're good
    } else if (semver.coerce(selectedReactRouterVersion)) {
      selectedReactRouterVersion = semver.coerce(
        selectedReactRouterVersion,
      )!.version;
    } else {
      log(
        `\n${color.warning(
          `${selectedReactRouterVersion} is an invalid version specifier. Using React Router v${pkgJson.version}.`,
        )}`,
      );
      selectedReactRouterVersion = undefined;
    }
  }

  let context: Context = {
    tempDir: path.join(
      await realpath(os.tmpdir()),
      `create-react-router--${Math.random().toString(36).substr(2, 8)}`,
    ),
    cwd,
    overwrite: getBooleanArg(values.overwrite),
    interactive,
    debug: getBooleanArg(values.debug) ?? false,
    agentSkills:
      getBooleanArg(values["agent-skills"]) ??
      (getBooleanArg(values["no-agent-skills"]) ? false : yes),
    git:
      getBooleanArg(values["git-init"]) ??
      (getBooleanArg(values["no-git-init"]) ? false : yes),
    help: getBooleanArg(values.help) ?? false,
    install:
      getBooleanArg(values.install) ??
      (getBooleanArg(values["no-install"]) ? false : yes),
    showInstallOutput: getBooleanArg(values["show-install-output"]) ?? false,
    noMotion: getBooleanArg(values["no-motion"]),
    pkgManager: validatePackageManager(
      getStringArg(values["package-manager"]) ??
        detectPackageManager() ??
        "npm",
    ),
    projectName,
    prompt,
    reactRouterVersion: selectedReactRouterVersion || pkgJson.version,
    template: getStringArg(values.template),
    token: getStringArg(values.token),
    versionRequested: getBooleanArg(values.version),
  };

  return context;
}

interface Context {
  tempDir: string;
  cwd: string;
  interactive: boolean;
  debug: boolean;
  agentSkills?: boolean;
  git?: boolean;
  help: boolean;
  install?: boolean;
  showInstallOutput: boolean;
  noMotion?: boolean;
  pkgManager: PackageManager;
  projectName?: string;
  prompt: typeof prompt;
  reactRouterVersion: string;
  stdin?: typeof process.stdin;
  stdout?: typeof process.stdout;
  template?: string;
  token?: string;
  versionRequested?: boolean;
  overwrite?: boolean;
}

async function introStep(ctx: Context) {
  log(
    `\n${" ".repeat(9)}${color.green(
      color.bold("create-react-router"),
    )} ${color.bold(`v${ctx.reactRouterVersion}`)}`,
  );

  if (!ctx.interactive) {
    log("");
    info("Shell is not interactive.", [
      `Using default options. This is equivalent to running with the `,
      color.reset("--yes"),
      ` flag.`,
    ]);
  }
}

async function projectNameStep(ctx: Context) {
  // valid cwd is required if shell isn't interactive
  if (!ctx.interactive && !ctx.cwd) {
    error("Oh no!", "No project directory provided");
    throw new Error("No project directory provided");
  }

  if (ctx.cwd) {
    await sleep(100);
    info("Directory:", [
      "Using ",
      color.reset(ctx.cwd),
      " as project directory",
    ]);
  }

  if (!ctx.cwd) {
    let { name } = await ctx.prompt({
      name: "name",
      type: "text",
      label: title("dir"),
      message: "Where should we create your new project?",
      initial: "./my-react-router-app",
    });
    ctx.cwd = name!;
    ctx.projectName = toValidProjectName(name!);
    return;
  }

  let name = ctx.cwd;
  if (name === "." || name === "./") {
    let parts = process.cwd().split(path.sep);
    name = parts[parts.length - 1];
  } else if (name.startsWith("./") || name.startsWith("../")) {
    let parts = name.split("/");
    name = parts[parts.length - 1];
  }
  ctx.projectName = toValidProjectName(name);
}

async function copyTemplateToTempDirStep(ctx: Context) {
  if (ctx.template) {
    log("");
    info("Template:", ["Using ", color.reset(ctx.template), "..."]);
  } else {
    log("");
    info("Using default template", [
      "See https://github.com/remix-run/react-router-templates for more",
    ]);
  }

  let template =
    ctx.template ??
    "https://github.com/remix-run/react-router-templates/tree/main/default";

  await loadingIndicator({
    start: "Template copying...",
    end: "Template copied",
    while: async () => {
      await ensureDirectory(ctx.tempDir);
      if (ctx.debug) {
        debug(`Extracting to: ${ctx.tempDir}`);
      }

      let result = await copyTemplate(template, ctx.tempDir, {
        debug: ctx.debug,
        token: ctx.token,
        async onError(err) {
          error(
            "Oh no!",
            err instanceof CopyTemplateError
              ? err.message
              : "Something went wrong. Run `create-react-router --debug` to see more info.\n\n" +
                  "Open an issue to report the problem at " +
                  "https://github.com/remix-run/react-router/issues/new",
          );
          throw err;
        },
        async log(message) {
          if (ctx.debug) {
            debug(message);
            await sleep(500);
          }
        },
      });

      if (result?.localTemplateDirectory) {
        ctx.tempDir = path.resolve(result.localTemplateDirectory);
      }
    },
    ctx,
  });
}

async function agentSkillsQuestionStep(ctx: Context) {
  if (ctx.agentSkills === undefined) {
    let { agentSkills = true } = await ctx.prompt({
      name: "agentSkills",
      type: "confirm",
      label: title("skill"),
      message: "Include the React Router agent skill?",
      hint: "recommended",
      initial: true,
    });
    ctx.agentSkills = agentSkills;
  }
}

async function copyAgentSkillsToAppDirStep(ctx: Context) {
  if (!ctx.agentSkills) {
    await sleep(100);
    info("Skipping agent skill.", [
      "You can add it later from ",
      color.reset(
        "https://github.com/remix-run/react-router/tree/main/.agents/skills/react-router",
      ),
      ".",
    ]);
    return;
  }

  if (!existsSync(path.join(agentSkillPath, "SKILL.md"))) {
    error(
      "Oh no!",
      "React Router agent skill files were not found in this package.",
    );
    throw new Error("React Router agent skill files were not found");
  }

  let destPath = path.join(ctx.cwd, ".agents", "skills", "react-router");

  if (existsSync(destPath)) {
    info("Agent skill:", "React Router agent skill already included");
    return;
  }

  await ensureDirectory(path.dirname(destPath));
  await cp(agentSkillPath, destPath, {
    errorOnExist: true,
    force: false,
    recursive: true,
  });
  info("Agent skill:", "Included React Router agent skill");
}

async function copyTempDirToAppDirStep(ctx: Context) {
  await ensureDirectory(ctx.cwd);

  let files1 = await getDirectoryFilesRecursive(ctx.tempDir);
  let files2 = await getDirectoryFilesRecursive(ctx.cwd);
  let collisions = files1
    .filter((f) => files2.includes(f))
    .sort((a, b) => a.localeCompare(b));

  if (collisions.length > 0) {
    let getFileList = (prefix: string) => {
      let moreFiles = collisions.length - 5;
      let lines = ["", ...collisions.slice(0, 5)];
      if (moreFiles > 0) {
        lines.push(`and ${moreFiles} more...`);
      }
      return lines.join(`\n${prefix}`);
    };

    if (ctx.overwrite) {
      info(
        "Overwrite:",
        `overwriting files due to \`--overwrite\`:${getFileList("           ")}`,
      );
    } else if (!ctx.interactive) {
      error(
        "Oh no!",
        `Destination directory contains files that would be overwritten\n` +
          `         and no \`--overwrite\` flag was included in a non-interactive\n` +
          `         environment. The following files would be overwritten:` +
          getFileList("           "),
      );
      throw new Error(
        "File collisions detected in a non-interactive environment",
      );
    } else {
      if (ctx.debug) {
        debug(`Colliding files:${getFileList("          ")}`);
      }

      let { overwrite } = await ctx.prompt({
        name: "overwrite",
        type: "confirm",
        label: title("overwrite"),
        message:
          `Your project directory contains files that will be overwritten by\n` +
          `             this template (you can force with \`--overwrite\`)\n\n` +
          `             Files that would be overwritten:` +
          `${getFileList("               ")}\n\n` +
          `             Do you wish to continue?\n` +
          `             `,
        initial: false,
      });
      if (!overwrite) {
        throw new Error("Exiting to avoid overwriting files");
      }
    }
  }

  await cp(ctx.tempDir, ctx.cwd, {
    filter(src) {
      // We never copy .git/ or node_modules/ directories since it's highly
      // unlikely we want them copied - and because templates are primarily
      // being pulled from git tarballs which won't have .git/ and shouldn't
      // have node_modules/
      let file = stripDirectoryFromPath(ctx.tempDir, src);
      let isIgnored = IGNORED_TEMPLATE_DIRECTORIES.includes(file);
      if (isIgnored) {
        if (ctx.debug) {
          debug(`Skipping copy of ${file} directory from template`);
        }
        return false;
      }
      return true;
    },
    recursive: true,
  });

  await updatePackageJSON(ctx);
}

async function installDependenciesQuestionStep(ctx: Context) {
  if (ctx.install === undefined) {
    let { deps = true } = await ctx.prompt({
      name: "deps",
      type: "confirm",
      label: title("deps"),
      message: `Install dependencies with ${ctx.pkgManager}?`,
      hint: "recommended",
      initial: true,
    });
    ctx.install = deps;
  }
}

async function installDependenciesStep(ctx: Context) {
  let { install, pkgManager, showInstallOutput, cwd } = ctx;

  if (!install) {
    await sleep(100);
    info("Skipping install step.", [
      "Remember to install dependencies after setup with ",
      color.reset(`${pkgManager} install`),
      ".",
    ]);
    return;
  }

  function runInstall() {
    return installDependencies({
      cwd,
      pkgManager,
      showInstallOutput,
    });
  }

  if (showInstallOutput) {
    log("");
    info(`Install`, `Dependencies installing with ${pkgManager}...`);
    log("");
    await runInstall();
    log("");
    return;
  }

  log("");
  await loadingIndicator({
    start: `Dependencies installing with ${pkgManager}...`,
    end: "Dependencies installed",
    while: runInstall,
    ctx,
  });
}

async function gitInitQuestionStep(ctx: Context) {
  if (existsSync(path.join(ctx.cwd, ".git"))) {
    info("Nice!", `Git has already been initialized`);
    return;
  }

  let git = ctx.git;
  if (ctx.git === undefined) {
    ({ git } = await ctx.prompt({
      name: "git",
      type: "confirm",
      label: title("git"),
      message: `Initialize a new git repository?`,
      hint: "recommended",
      initial: true,
    }));
  }

  ctx.git = git ?? false;
}

async function gitInitStep(ctx: Context) {
  if (!ctx.git) {
    return;
  }

  if (existsSync(path.join(ctx.cwd, ".git"))) {
    log("");
    info("Nice!", `Git has already been initialized`);
    return;
  }

  log("");
  await loadingIndicator({
    start: "Git initializing...",
    end: "Git initialized",
    while: async () => {
      let options = { cwd: ctx.cwd, stdio: "ignore" } as const;
      let commitMsg = "Initial commit from create-react-router";
      try {
        await runCommand("git", ["init"], options);
        await runCommand("git", ["add", "."], options);
        await runCommand("git", ["commit", "-m", commitMsg], options);
      } catch (err) {
        error("Oh no!", "Failed to initialize git.");
        throw err;
      }
    },
    ctx,
  });
}

async function doneStep(ctx: Context) {
  let projectDir = path.relative(process.cwd(), ctx.cwd);

  let max = process.stdout.columns;
  let prefix = max < 80 ? " " : " ".repeat(9);
  await sleep(200);

  log(`\n ${color.bgWhite(color.black(" done "))}  That's it!`);
  await sleep(100);
  if (projectDir !== "") {
    let enter = [
      `\n${prefix}Enter your project directory using`,
      color.cyan(`cd .${path.sep}${projectDir}`),
    ];
    let len = enter[0].length + stripVTControlCharacters(enter[1]).length;
    log(enter.join(len > max ? "\n" + prefix : " "));
  }
  log(
    `${prefix}Check out ${color.bold(
      "README.md",
    )} for development and deploy instructions.`,
  );
  await sleep(100);
  log(
    `\n${prefix}Join the community at ${color.cyan(`https://remix.run/discord`)}\n`,
  );
  await sleep(200);
}

const validPackageManagers = [
  "npm",
  "yarn",
  "pnpm",
  "bun",
  "deno",
  "nub",
] as const;
type PackageManager = (typeof validPackageManagers)[number];

function validatePackageManager(pkgManager: string): PackageManager {
  return validPackageManagers.find((name) => pkgManager === name) ?? "npm";
}

/**
 * Determine which package manager the user prefers.
 *
 * npm, pnpm, Yarn, Bun, Deno, and nub set the user agent environment variable
 * that can be used to determine which package manager ran the command.
 */
function detectPackageManager(): PackageManager | undefined {
  let { npm_config_user_agent } = process.env;
  if (!npm_config_user_agent) return undefined;
  try {
    let pkgManager = npm_config_user_agent.split("/")[0];
    if (pkgManager === "npm") return "npm";
    if (pkgManager === "pnpm") return "pnpm";
    if (pkgManager === "yarn") return "yarn";
    if (pkgManager === "bun") return "bun";
    if (pkgManager === "deno") return "deno";
    if (pkgManager === "nub") return "nub";
    return undefined;
  } catch {
    return undefined;
  }
}

async function installDependencies({
  pkgManager,
  cwd,
  showInstallOutput,
}: {
  pkgManager: PackageManager;
  cwd: string;
  showInstallOutput: boolean;
}) {
  try {
    await runCommand(pkgManager, ["install"], {
      cwd,
      stdio: showInstallOutput ? "inherit" : "ignore",
    });
  } catch (err) {
    error("Oh no!", "Failed to install dependencies.");
    throw err;
  }
}

function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; stdio: StdioOptions },
) {
  return new Promise<void>((resolve, reject) => {
    let child = spawn(command, args, options);
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            signal
              ? `${command} exited with signal ${signal}`
              : `${command} exited with code ${code}`,
          ),
        );
      }
    });
  });
}

async function updatePackageJSON(ctx: Context) {
  let packageJSONPath = path.join(ctx.cwd, "package.json");
  if (!existsSync(packageJSONPath)) {
    let relativePath = path.relative(process.cwd(), ctx.cwd);
    error(
      "Oh no!",
      "The provided template must be a React Router project with a `package.json` " +
        `file, but that file does not exist in ${color.bold(relativePath)}.`,
    );
    throw new Error(`package.json does not exist in ${ctx.cwd}`);
  }

  let contents = await readFile(packageJSONPath, "utf-8");
  let packageJSON: any;
  try {
    packageJSON = JSON.parse(contents);
    if (!isValidJsonObject(packageJSON)) {
      throw Error();
    }
  } catch (err) {
    error(
      "Oh no!",
      "The provided template must be a React Router project with a `package.json` " +
        `file, but that file is invalid.`,
    );
    throw err;
  }

  for (let pkgKey of ["dependencies", "devDependencies"] as const) {
    let dependencies = packageJSON[pkgKey];
    if (!dependencies) continue;

    if (!isValidJsonObject(dependencies)) {
      error(
        "Oh no!",
        "The provided template must be a React Router project with a `package.json` " +
          `file, but its ${pkgKey} value is invalid.`,
      );
      throw new Error(`package.json ${pkgKey} are invalid`);
    }

    for (let dependency in dependencies) {
      let version = dependencies[dependency];
      if (
        (dependency.startsWith("@react-router/") ||
          dependency === "react-router") &&
        version === "*"
      ) {
        dependencies[dependency] = semver.prerelease(ctx.reactRouterVersion)
          ? // Templates created from prereleases should pin to a specific version
            ctx.reactRouterVersion
          : "^" + ctx.reactRouterVersion;
      }
    }
  }

  packageJSON.name = ctx.projectName;

  writeFile(
    packageJSONPath,
    JSON.stringify(sortPackageJSON(packageJSON), null, 2),
    "utf-8",
  );
}

async function loadingIndicator(args: {
  start: string;
  end: string;
  while: (...args: any) => Promise<any>;
  ctx: Context;
}) {
  let { ctx, ...rest } = args;
  await renderLoadingIndicator({
    ...rest,
    noMotion: args.ctx.noMotion,
  });
}

function title(text: string) {
  return align(color.bgWhite(` ${color.black(text)} `), "end", 7) + " ";
}

function printHelp(ctx: Context) {
  // prettier-ignore
  let output = `
${title("create-react-router")}

${color.heading("Usage")}:

${color.dim("$")} ${color.greenBright("create-react-router")} ${color.arg("<projectDir>")} ${color.arg("<...options>")}

${color.heading("Values")}:

${color.arg("projectDir")}          ${color.dim(`The React Router project directory`)}

${color.heading("Options")}:

${color.arg("--help, -h")}          ${color.dim(`Print this help message and exit`)}
${color.arg("--version, -V")}       ${color.dim(`Print the CLI version and exit`)}
${color.arg("--no-color")}          ${color.dim(`Disable ANSI colors in console output`)}
${color.arg("--no-motion")}         ${color.dim(`Disable animations in console output`)}

${color.arg("--template <name>")}   ${color.dim(`The project template to use`)}
${color.arg("--[no-]install")}      ${color.dim(`Whether or not to install dependencies after creation`)}
${color.arg("--package-manager")}   ${color.dim(`The package manager to use`)}
${color.arg("--show-install-output")}   ${color.dim(`Whether to show the output of the install process`)}
${color.arg("--[no-]agent-skills")} ${color.dim(`Whether or not to include the React Router agent skill`)}
${color.arg("--[no-]git-init")}     ${color.dim(`Whether or not to initialize a Git repository`)}
${color.arg("--yes, -y")}           ${color.dim(`Skip all option prompts and run setup`)}
${color.arg("--react-router-version, -v")}     ${color.dim(`The version of React Router to use`)}

${color.heading("Creating a new project")}:

React Router projects are created from templates. A template can be:

- a GitHub repo shorthand, :username/:repo or :username/:repo/:directory
- the URL of a GitHub repo (or directory within it)
- the URL of a tarball
- a file path to a directory of files
- a file path to a tarball
${[
  "remix-run/react-router/templates/basic",
  "remix-run/react-router/examples/basic",
  ":username/:repo",
  ":username/:repo/:directory",
  "https://github.com/:username/:repo",
  "https://github.com/:username/:repo/tree/:branch",
  "https://github.com/:username/:repo/tree/:branch/:directory",
  "https://github.com/:username/:repo/archive/refs/tags/:tag.tar.gz",
  "https://example.com/template.tar.gz",
  "./path/to/template",
  "./path/to/template.tar.gz",
].reduce((str, example) => {
  return `${str}\n${color.dim("$")} ${color.greenBright("create-react-router")} my-app ${color.arg(`--template ${example}`)}`;
}, "")}

To create a new project from a template in a private GitHub repo,
pass the \`token\` flag with a personal access token with access
to that repo.
`;

  log(output);
}

function align(text: string, dir: "start" | "end" | "center", len: number) {
  let pad = Math.max(len - strip(text).length, 0);
  switch (dir) {
    case "start":
      return text + " ".repeat(pad);
    case "end":
      return " ".repeat(pad) + text;
    case "center":
      return (
        " ".repeat(Math.floor(pad / 2)) + text + " ".repeat(Math.floor(pad / 2))
      );
    default:
      return text;
  }
}

export { createReactRouter };
export type { Context };
