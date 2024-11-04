import path from "node:path";
import process from "node:process";
import os from "node:os";
import fs from "node:fs";
import { type Key as ActionKey } from "node:readline";
import { erase, cursor } from "sisteransi";
import chalk from "chalk";
import recursiveReaddir from "recursive-readdir";

// https://no-color.org/
const SUPPORTS_COLOR = chalk.supportsColor && !process.env.NO_COLOR;

export const color = {
  supportsColor: SUPPORTS_COLOR,
  heading: safeColor(chalk.bold),
  arg: safeColor(chalk.yellowBright),
  error: safeColor(chalk.red),
  warning: safeColor(chalk.yellow),
  hint: safeColor(chalk.blue),
  bold: safeColor(chalk.bold),
  black: safeColor(chalk.black),
  white: safeColor(chalk.white),
  blue: safeColor(chalk.blue),
  cyan: safeColor(chalk.cyan),
  red: safeColor(chalk.red),
  yellow: safeColor(chalk.yellow),
  green: safeColor(chalk.green),
  blackBright: safeColor(chalk.blackBright),
  whiteBright: safeColor(chalk.whiteBright),
  blueBright: safeColor(chalk.blueBright),
  cyanBright: safeColor(chalk.cyanBright),
  redBright: safeColor(chalk.redBright),
  yellowBright: safeColor(chalk.yellowBright),
  greenBright: safeColor(chalk.greenBright),
  bgBlack: safeColor(chalk.bgBlack),
  bgWhite: safeColor(chalk.bgWhite),
  bgBlue: safeColor(chalk.bgBlue),
  bgCyan: safeColor(chalk.bgCyan),
  bgRed: safeColor(chalk.bgRed),
  bgYellow: safeColor(chalk.bgYellow),
  bgGreen: safeColor(chalk.bgGreen),
  bgBlackBright: safeColor(chalk.bgBlackBright),
  bgWhiteBright: safeColor(chalk.bgWhiteBright),
  bgBlueBright: safeColor(chalk.bgBlueBright),
  bgCyanBright: safeColor(chalk.bgCyanBright),
  bgRedBright: safeColor(chalk.bgRedBright),
  bgYellowBright: safeColor(chalk.bgYellowBright),
  bgGreenBright: safeColor(chalk.bgGreenBright),
  gray: safeColor(chalk.gray),
  dim: safeColor(chalk.dim),
  reset: safeColor(chalk.reset),
  inverse: safeColor(chalk.inverse),
  hex: (color: string) => safeColor(chalk.hex(color)),
  underline: chalk.underline,
};

function safeColor(style: chalk.Chalk) {
  return SUPPORTS_COLOR ? style : identity;
}

export { type ActionKey };

const unicode = { enabled: os.platform() !== "win32" };
export const shouldUseAscii = () => !unicode.enabled;

export function isInteractive() {
  // Support explicit override for testing purposes
  if ("CREATE_REACT_ROUTER_FORCE_INTERACTIVE" in process.env) {
    return true;
  }

  // Adapted from https://github.com/sindresorhus/is-interactive
  return Boolean(
    process.stdout.isTTY &&
      process.env.TERM !== "dumb" &&
      !("CI" in process.env)
  );
}

export function log(message: string) {
  return process.stdout.write(message + "\n");
}

export let stderr = process.stderr;
/** @internal Used to mock `process.stderr.write` for testing purposes */
export function setStderr(writable: typeof process.stderr) {
  stderr = writable;
}

export function logError(message: string) {
  return stderr.write(message + "\n");
}

function logBullet(
  logger: typeof log | typeof logError,
  colorizePrefix: <V>(v: V) => V,
  colorizeText: <V>(v: V) => V,
  symbol: string,
  prefix: string,
  text?: string | string[]
) {
  let textParts = Array.isArray(text) ? text : [text || ""].filter(Boolean);
  let formattedText = textParts
    .map((textPart) => colorizeText(textPart))
    .join("");

  if (process.stdout.columns < 80) {
    logger(
      `${" ".repeat(5)} ${colorizePrefix(symbol)}  ${colorizePrefix(prefix)}`
    );
    logger(`${" ".repeat(9)}${formattedText}`);
  } else {
    logger(
      `${" ".repeat(5)} ${colorizePrefix(symbol)}  ${colorizePrefix(
        prefix
      )} ${formattedText}`
    );
  }
}

export function debug(prefix: string, text?: string | string[]) {
  logBullet(log, color.yellow, color.dim, "●", prefix, text);
}

export function info(prefix: string, text?: string | string[]) {
  logBullet(log, color.cyan, color.dim, "◼", prefix, text);
}

export function success(text: string) {
  logBullet(log, color.green, color.dim, "✔", text);
}

export function error(prefix: string, text?: string | string[]) {
  log("");
  logBullet(logError, color.red, color.error, "▲", prefix, text);
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function toValidProjectName(projectName: string) {
  if (isValidProjectName(projectName)) {
    return projectName;
  }
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z\d\-~]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function isValidProjectName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName
  );
}

export function identity<V>(v: V) {
  return v;
}

export function strip(str: string) {
  let pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))",
  ].join("|");
  let RGX = new RegExp(pattern, "g");
  return typeof str === "string" ? str.replace(RGX, "") : str;
}

export function reverse<T>(arr: T[]): T[] {
  return [...arr].reverse();
}

export function isValidJsonObject(obj: any): obj is Record<string, unknown> {
  return !!(obj && typeof obj === "object" && !Array.isArray(obj));
}

export async function directoryExists(p: string) {
  try {
    let stat = await fs.promises.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function fileExists(p: string) {
  try {
    let stat = await fs.promises.stat(p);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function ensureDirectory(dir: string) {
  if (!(await directoryExists(dir))) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}

export function pathContains(path: string, dir: string) {
  let relative = path.replace(dir, "");
  return relative.length < path.length && !relative.startsWith("..");
}

export function isUrl(value: string | URL) {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}

export function clear(prompt: string, perLine: number) {
  if (!perLine) return erase.line + cursor.to(0);
  let rows = 0;
  let lines = prompt.split(/\r?\n/);
  for (let line of lines) {
    rows += 1 + Math.floor(Math.max(strip(line).length - 1, 0) / perLine);
  }

  return erase.lines(rows);
}

export function lines(msg: string, perLine: number) {
  let lines = String(strip(msg) || "").split(/\r?\n/);
  if (!perLine) return lines.length;
  return lines
    .map((l) => Math.ceil(l.length / perLine))
    .reduce((a, b) => a + b);
}

export function action(key: ActionKey, isSelect: boolean) {
  if (key.meta && key.name !== "escape") return;

  if (key.ctrl) {
    if (key.name === "a") return "first";
    if (key.name === "c") return "abort";
    if (key.name === "d") return "abort";
    if (key.name === "e") return "last";
    if (key.name === "g") return "reset";
  }

  if (isSelect) {
    if (key.name === "j") return "down";
    if (key.name === "k") return "up";
  }

  if (key.name === "return") return "submit";
  if (key.name === "enter") return "submit"; // ctrl + J
  if (key.name === "backspace") return "delete";
  if (key.name === "delete") return "deleteForward";
  if (key.name === "abort") return "abort";
  if (key.name === "escape") return "exit";
  if (key.name === "tab") return "next";
  if (key.name === "pagedown") return "nextPage";
  if (key.name === "pageup") return "prevPage";
  if (key.name === "home") return "home";
  if (key.name === "end") return "end";

  if (key.name === "up") return "up";
  if (key.name === "down") return "down";
  if (key.name === "right") return "right";
  if (key.name === "left") return "left";

  return false;
}

export function stripDirectoryFromPath(dir: string, filePath: string) {
  // Can't just do a regexp replace here since the windows paths mess it up :/
  let stripped = filePath;
  if (
    (dir.endsWith(path.sep) && filePath.startsWith(dir)) ||
    (!dir.endsWith(path.sep) && filePath.startsWith(dir + path.sep))
  ) {
    stripped = filePath.slice(dir.length);
    if (stripped.startsWith(path.sep)) {
      stripped = stripped.slice(1);
    }
  }
  return stripped;
}

// We do not copy these folders from templates so we can ignore them for comparisons
export const IGNORED_TEMPLATE_DIRECTORIES = [".git", "node_modules"];

export async function getDirectoryFilesRecursive(dir: string) {
  let files = await recursiveReaddir(dir, [
    (file) => {
      let strippedFile = stripDirectoryFromPath(dir, file);
      let parts = strippedFile.split(path.sep);
      return (
        parts.length > 1 && IGNORED_TEMPLATE_DIRECTORIES.includes(parts[0])
      );
    },
  ]);
  return files.map((f) => stripDirectoryFromPath(dir, f));
}
