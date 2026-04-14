#!/usr/bin/env node
/**
 * create-react-router v7.14.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// cli.ts
var import_node_process7 = __toESM(require("process"));

// index.ts
var import_node_process6 = __toESM(require("process"));
var import_node_fs3 = require("fs");
var import_promises2 = require("fs/promises");
var import_node_os2 = __toESM(require("os"));
var import_node_path3 = __toESM(require("path"));
var import_strip_ansi = __toESM(require("strip-ansi"));
var import_execa = __toESM(require("execa"));
var import_arg = __toESM(require("arg"));
var semver = __toESM(require("semver"));
var import_sort_package_json = __toESM(require("sort-package-json"));

// package.json
var version = "7.14.1";

// prompt.ts
var import_node_process3 = __toESM(require("process"));

// prompts-confirm.ts
var import_sisteransi3 = require("sisteransi");

// prompts-prompt-base.ts
var import_node_process2 = __toESM(require("process"));
var import_node_events = __toESM(require("events"));
var import_node_readline = __toESM(require("readline"));
var import_sisteransi2 = require("sisteransi");

// utils.ts
var import_node_fs = __toESM(require("fs"));
var import_promises = require("fs/promises");
var import_node_path = __toESM(require("path"));
var import_node_process = __toESM(require("process"));
var import_node_os = __toESM(require("os"));
var import_sisteransi = require("sisteransi");
var import_picocolors = __toESM(require("picocolors"));
var SUPPORTS_COLOR = import_picocolors.default.isColorSupported;
var color = {
  supportsColor: SUPPORTS_COLOR,
  heading: safeColor(import_picocolors.default.bold),
  arg: safeColor(import_picocolors.default.yellowBright),
  error: safeColor(import_picocolors.default.red),
  warning: safeColor(import_picocolors.default.yellow),
  hint: safeColor(import_picocolors.default.blue),
  bold: safeColor(import_picocolors.default.bold),
  black: safeColor(import_picocolors.default.black),
  white: safeColor(import_picocolors.default.white),
  blue: safeColor(import_picocolors.default.blue),
  cyan: safeColor(import_picocolors.default.cyan),
  red: safeColor(import_picocolors.default.red),
  yellow: safeColor(import_picocolors.default.yellow),
  green: safeColor(import_picocolors.default.green),
  blackBright: safeColor(import_picocolors.default.blackBright),
  whiteBright: safeColor(import_picocolors.default.whiteBright),
  blueBright: safeColor(import_picocolors.default.blueBright),
  cyanBright: safeColor(import_picocolors.default.cyanBright),
  redBright: safeColor(import_picocolors.default.redBright),
  yellowBright: safeColor(import_picocolors.default.yellowBright),
  greenBright: safeColor(import_picocolors.default.greenBright),
  bgBlack: safeColor(import_picocolors.default.bgBlack),
  bgWhite: safeColor(import_picocolors.default.bgWhite),
  bgBlue: safeColor(import_picocolors.default.bgBlue),
  bgCyan: safeColor(import_picocolors.default.bgCyan),
  bgRed: safeColor(import_picocolors.default.bgRed),
  bgYellow: safeColor(import_picocolors.default.bgYellow),
  bgGreen: safeColor(import_picocolors.default.bgGreen),
  bgBlackBright: safeColor(import_picocolors.default.bgBlackBright),
  bgWhiteBright: safeColor(import_picocolors.default.bgWhiteBright),
  bgBlueBright: safeColor(import_picocolors.default.bgBlueBright),
  bgCyanBright: safeColor(import_picocolors.default.bgCyanBright),
  bgRedBright: safeColor(import_picocolors.default.bgRedBright),
  bgYellowBright: safeColor(import_picocolors.default.bgYellowBright),
  bgGreenBright: safeColor(import_picocolors.default.bgGreenBright),
  gray: safeColor(import_picocolors.default.gray),
  dim: safeColor(import_picocolors.default.dim),
  reset: safeColor(import_picocolors.default.reset),
  inverse: safeColor(import_picocolors.default.inverse),
  hex: (hex) => safeColor(hexColor(hex)),
  underline: import_picocolors.default.underline
};
function hexColor(hex) {
  let h = hex.replace("#", "");
  let r = parseInt(h.substring(0, 2), 16);
  let g = parseInt(h.substring(2, 4), 16);
  let b = parseInt(h.substring(4, 6), 16);
  return (input) => `\x1B[38;2;${r};${g};${b}m${input}\x1B[39m`;
}
function safeColor(style) {
  return SUPPORTS_COLOR ? style : identity;
}
var unicode = { enabled: import_node_os.default.platform() !== "win32" };
var shouldUseAscii = () => !unicode.enabled;
function isInteractive() {
  if ("CREATE_REACT_ROUTER_FORCE_INTERACTIVE" in import_node_process.default.env) {
    return true;
  }
  return Boolean(
    import_node_process.default.stdout.isTTY && import_node_process.default.env.TERM !== "dumb" && !("CI" in import_node_process.default.env)
  );
}
function log(message) {
  return import_node_process.default.stdout.write(message + "\n");
}
var stderr = import_node_process.default.stderr;
function logError(message) {
  return stderr.write(message + "\n");
}
function logBullet(logger, colorizePrefix, colorizeText, symbol, prefix, text) {
  let textParts = Array.isArray(text) ? text : [text || ""].filter(Boolean);
  let formattedText = textParts.map((textPart) => colorizeText(textPart)).join("");
  if (import_node_process.default.stdout.columns < 80) {
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
function debug(prefix, text) {
  logBullet(log, color.yellow, color.dim, "\u25CF", prefix, text);
}
function info(prefix, text) {
  logBullet(log, color.cyan, color.dim, "\u25FC", prefix, text);
}
function error(prefix, text) {
  log("");
  logBullet(logError, color.red, color.error, "\u25B2", prefix, text);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function toValidProjectName(projectName) {
  if (isValidProjectName(projectName)) {
    return projectName;
  }
  return projectName.trim().toLowerCase().replace(/\s+/g, "-").replace(/^[._]/, "").replace(/[^a-z\d\-~]+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
function isValidProjectName(projectName) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName
  );
}
function identity(v) {
  return v;
}
function strip(str) {
  let pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))"
  ].join("|");
  let RGX = new RegExp(pattern, "g");
  return typeof str === "string" ? str.replace(RGX, "") : str;
}
function reverse(arr) {
  return [...arr].reverse();
}
function isValidJsonObject(obj) {
  return !!(obj && typeof obj === "object" && !Array.isArray(obj));
}
async function directoryExists(p) {
  try {
    let stat = await import_node_fs.default.promises.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
async function ensureDirectory(dir) {
  if (!await directoryExists(dir)) {
    await import_node_fs.default.promises.mkdir(dir, { recursive: true });
  }
}
function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}
function clear(prompt2, perLine) {
  if (!perLine) return import_sisteransi.erase.line + import_sisteransi.cursor.to(0);
  let rows = 0;
  let lines2 = prompt2.split(/\r?\n/);
  for (let line of lines2) {
    rows += 1 + Math.floor(Math.max(strip(line).length - 1, 0) / perLine);
  }
  return import_sisteransi.erase.lines(rows);
}
function lines(msg, perLine) {
  let lines2 = String(strip(msg) || "").split(/\r?\n/);
  if (!perLine) return lines2.length;
  return lines2.map((l) => Math.ceil(l.length / perLine)).reduce((a, b) => a + b);
}
function action(key, isSelect) {
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
  if (key.name === "enter") return "submit";
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
function stripDirectoryFromPath(dir, filePath) {
  let stripped = filePath;
  if (dir.endsWith(import_node_path.default.sep) && filePath.startsWith(dir) || !dir.endsWith(import_node_path.default.sep) && filePath.startsWith(dir + import_node_path.default.sep)) {
    stripped = filePath.slice(dir.length);
    if (stripped.startsWith(import_node_path.default.sep)) {
      stripped = stripped.slice(1);
    }
  }
  return stripped;
}
var IGNORED_TEMPLATE_DIRECTORIES = [".git", "node_modules"];
async function getDirectoryFilesRecursive(dir) {
  return (await (0, import_promises.readdir)(dir, { recursive: true })).filter((file) => {
    let parts = file.split(import_node_path.default.sep);
    return parts.length <= 1 || !IGNORED_TEMPLATE_DIRECTORIES.includes(parts[0]);
  });
}

// prompts-prompt-base.ts
var Prompt = class extends import_node_events.default {
  firstRender;
  in;
  out;
  onRender;
  close;
  aborted;
  exited;
  closed;
  name = "Prompt";
  constructor(opts = {}) {
    super();
    this.firstRender = true;
    this.in = opts.stdin || import_node_process2.default.stdin;
    this.out = opts.stdout || import_node_process2.default.stdout;
    this.onRender = (opts.onRender || (() => void 0)).bind(this);
    let rl = import_node_readline.default.createInterface({
      input: this.in,
      escapeCodeTimeout: 50
    });
    import_node_readline.default.emitKeypressEvents(this.in, rl);
    if (this.in.isTTY) this.in.setRawMode(true);
    let isSelect = ["SelectPrompt", "MultiSelectPrompt"].indexOf(this.constructor.name) > -1;
    let keypress = (str, key) => {
      if (this.in.isTTY) this.in.setRawMode(true);
      let a = action(key, isSelect);
      if (a === false) {
        try {
          this._(str, key);
        } catch (_) {
        }
      } else if (typeof this[a] === "function") {
        this[a](key);
      }
    };
    this.close = () => {
      this.out.write(import_sisteransi2.cursor.show);
      this.in.removeListener("keypress", keypress);
      if (this.in.isTTY) this.in.setRawMode(false);
      rl.close();
      this.emit(
        this.aborted ? "abort" : this.exited ? "exit" : "submit",
        // @ts-expect-error
        this.value
      );
      this.closed = true;
    };
    this.in.on("keypress", keypress);
  }
  get type() {
    throw new Error("Method type not implemented.");
  }
  bell() {
    this.out.write(import_sisteransi2.beep);
  }
  fire() {
    this.emit("state", {
      // @ts-expect-error
      value: this.value,
      aborted: !!this.aborted,
      exited: !!this.exited
    });
  }
  render() {
    this.onRender(color);
    if (this.firstRender) this.firstRender = false;
  }
  _(c, key) {
    throw new Error("Method _ not implemented.");
  }
};

// prompts-confirm.ts
var ConfirmPrompt = class extends Prompt {
  label;
  msg;
  value;
  initialValue;
  hint;
  choices;
  cursor;
  done;
  name = "ConfirmPrompt";
  // set by render which is called in constructor
  outputText;
  constructor(opts) {
    super(opts);
    this.label = opts.label;
    this.hint = opts.hint;
    this.msg = opts.message;
    this.value = opts.initial;
    this.initialValue = !!opts.initial;
    this.choices = [
      { value: true, label: "Yes" },
      { value: false, label: "No" }
    ];
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue);
    this.render();
  }
  get type() {
    return "confirm";
  }
  exit() {
    this.abort();
  }
  abort() {
    this.done = this.aborted = true;
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  submit() {
    this.value = this.value || false;
    this.cursor = this.choices.findIndex((c) => c.value === this.value);
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  moveCursor(n) {
    this.cursor = n;
    this.value = this.choices[n].value;
    this.fire();
  }
  reset() {
    this.moveCursor(0);
    this.fire();
    this.render();
  }
  first() {
    this.moveCursor(0);
    this.render();
  }
  last() {
    this.moveCursor(this.choices.length - 1);
    this.render();
  }
  left() {
    if (this.cursor === 0) {
      this.moveCursor(this.choices.length - 1);
    } else {
      this.moveCursor(this.cursor - 1);
    }
    this.render();
  }
  right() {
    if (this.cursor === this.choices.length - 1) {
      this.moveCursor(0);
    } else {
      this.moveCursor(this.cursor + 1);
    }
    this.render();
  }
  _(c, key) {
    if (!Number.isNaN(Number.parseInt(c))) {
      let n = Number.parseInt(c) - 1;
      this.moveCursor(n);
      this.render();
      return this.submit();
    }
    if (c.toLowerCase() === "y") {
      this.value = true;
      return this.submit();
    }
    if (c.toLowerCase() === "n") {
      this.value = false;
      return this.submit();
    }
    return;
  }
  render() {
    if (this.closed) {
      return;
    }
    if (this.firstRender) {
      this.out.write(import_sisteransi3.cursor.hide);
    } else {
      this.out.write(clear(this.outputText, this.out.columns));
    }
    super.render();
    let outputText = [
      "\n",
      this.label,
      " ",
      this.msg,
      this.done ? "" : this.hint ? color.dim(` (${this.hint})`) : "",
      "\n"
    ];
    outputText.push(" ".repeat(strip(this.label).length));
    if (this.done) {
      outputText.push(" ", color.dim(`${this.choices[this.cursor].label}`));
    } else {
      outputText.push(
        " ",
        this.choices.map(
          (choice, i) => i === this.cursor ? `${color.green("\u25CF")} ${choice.label} ` : color.dim(`\u25CB ${choice.label} `)
        ).join(color.dim(" "))
      );
    }
    this.outputText = outputText.join("");
    this.out.write(import_sisteransi3.erase.line + import_sisteransi3.cursor.to(0) + this.outputText);
  }
};

// prompts-select.ts
var import_sisteransi4 = require("sisteransi");
var SelectPrompt = class extends Prompt {
  choices;
  label;
  msg;
  hint;
  value;
  initialValue;
  search;
  done;
  cursor;
  name = "SelectPrompt";
  _timeout;
  // set by render which is called in constructor
  outputText;
  constructor(opts) {
    if (!opts.choices || !Array.isArray(opts.choices) || opts.choices.length < 1) {
      throw new Error("SelectPrompt must contain choices");
    }
    super(opts);
    this.label = opts.label;
    this.hint = opts.hint;
    this.msg = opts.message;
    this.value = opts.initial;
    this.choices = opts.choices;
    this.initialValue = opts.initial || this.choices[0].value;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue);
    this.search = null;
    this.render();
  }
  get type() {
    return "select";
  }
  exit() {
    this.abort();
  }
  abort() {
    this.done = this.aborted = true;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue);
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  submit() {
    this.value = this.value || void 0;
    this.cursor = this.choices.findIndex((c) => c.value === this.value);
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  delete() {
    this.search = null;
    this.render();
  }
  _(c, key) {
    if (this._timeout) clearTimeout(this._timeout);
    if (!Number.isNaN(Number.parseInt(c))) {
      let n2 = Number.parseInt(c) - 1;
      this.moveCursor(n2);
      this.render();
      return this.submit();
    }
    this.search = this.search || "";
    this.search += c.toLowerCase();
    let choices = !this.search ? this.choices.slice(this.cursor) : this.choices;
    let n = choices.findIndex(
      (c2) => c2.label.toLowerCase().includes(this.search)
    );
    if (n > -1) {
      this.moveCursor(n);
      this.render();
    }
    this._timeout = setTimeout(() => {
      this.search = null;
    }, 500);
  }
  moveCursor(n) {
    this.cursor = n;
    this.value = this.choices[n].value;
    this.fire();
  }
  reset() {
    this.moveCursor(0);
    this.fire();
    this.render();
  }
  first() {
    this.moveCursor(0);
    this.render();
  }
  last() {
    this.moveCursor(this.choices.length - 1);
    this.render();
  }
  up() {
    if (this.cursor === 0) {
      this.moveCursor(this.choices.length - 1);
    } else {
      this.moveCursor(this.cursor - 1);
    }
    this.render();
  }
  down() {
    if (this.cursor === this.choices.length - 1) {
      this.moveCursor(0);
    } else {
      this.moveCursor(this.cursor + 1);
    }
    this.render();
  }
  highlight(label) {
    if (!this.search) return label;
    let n = label.toLowerCase().indexOf(this.search.toLowerCase());
    if (n === -1) return label;
    return [
      label.slice(0, n),
      color.underline(label.slice(n, n + this.search.length)),
      label.slice(n + this.search.length)
    ].join("");
  }
  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(import_sisteransi4.cursor.hide);
    else this.out.write(clear(this.outputText, this.out.columns));
    super.render();
    let outputText = [
      "\n",
      this.label,
      " ",
      this.msg,
      this.done ? "" : this.hint ? (this.out.columns < 80 ? "\n" + " ".repeat(8) : "") + color.dim(` (${this.hint})`) : "",
      "\n"
    ];
    let prefix = " ".repeat(strip(this.label).length);
    if (this.done) {
      outputText.push(
        `${prefix} `,
        color.dim(`${this.choices[this.cursor]?.label}`)
      );
    } else {
      outputText.push(
        this.choices.map(
          (choice, i) => i === this.cursor ? `${prefix} ${color.green(
            shouldUseAscii() ? ">" : "\u25CF"
          )} ${this.highlight(choice.label)} ${choice.hint ? color.dim(choice.hint) : ""}` : color.dim(
            `${prefix} ${shouldUseAscii() ? "\u2014" : "\u25CB"} ${choice.label} `
          )
        ).join("\n")
      );
    }
    this.outputText = outputText.join("");
    this.out.write(import_sisteransi4.erase.line + import_sisteransi4.cursor.to(0) + this.outputText);
  }
};

// prompts-multi-select.ts
var import_sisteransi5 = require("sisteransi");
var MultiSelectPrompt = class extends Prompt {
  choices;
  label;
  msg;
  hint;
  value;
  initialValue;
  done;
  cursor;
  name = "MultiSelectPrompt";
  // set by render which is called in constructor
  outputText;
  constructor(opts) {
    if (!opts.choices || !Array.isArray(opts.choices) || opts.choices.length < 1) {
      throw new Error("MultiSelectPrompt must contain choices");
    }
    super(opts);
    this.label = opts.label;
    this.msg = opts.message;
    this.hint = opts.hint;
    this.value = [];
    this.choices = opts.choices.map((choice) => ({ ...choice, selected: false })) || [];
    this.initialValue = opts.initial || this.choices[0].value;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue);
    this.render();
  }
  get type() {
    return "multiselect";
  }
  exit() {
    this.abort();
  }
  abort() {
    this.done = this.aborted = true;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue);
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  submit() {
    return this.toggle();
  }
  finish() {
    this.value = this.value;
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  moveCursor(n) {
    this.cursor = n;
    this.fire();
  }
  toggle() {
    let choice = this.choices[this.cursor];
    if (!choice) return;
    choice.selected = !choice.selected;
    this.render();
  }
  _(c, key) {
    if (c === " ") {
      return this.toggle();
    }
    if (c.toLowerCase() === "c") {
      return this.finish();
    }
    return;
  }
  reset() {
    this.moveCursor(0);
    this.fire();
    this.render();
  }
  first() {
    this.moveCursor(0);
    this.render();
  }
  last() {
    this.moveCursor(this.choices.length - 1);
    this.render();
  }
  up() {
    if (this.cursor === 0) {
      this.moveCursor(this.choices.length - 1);
    } else {
      this.moveCursor(this.cursor - 1);
    }
    this.render();
  }
  down() {
    if (this.cursor === this.choices.length - 1) {
      this.moveCursor(0);
    } else {
      this.moveCursor(this.cursor + 1);
    }
    this.render();
  }
  render() {
    if (this.closed) return;
    if (this.firstRender) {
      this.out.write(import_sisteransi5.cursor.hide);
    } else {
      this.out.write(clear(this.outputText, this.out.columns));
    }
    super.render();
    let outputText = ["\n", this.label, " ", this.msg, "\n"];
    let prefix = " ".repeat(strip(this.label).length);
    if (this.done) {
      outputText.push(
        this.choices.map(
          (choice) => choice.selected ? `${prefix} ${color.dim(`${choice.label}`)}
` : ""
        ).join("").trimEnd()
      );
    } else {
      outputText.push(
        this.choices.map(
          (choice, i) => i === this.cursor ? `${prefix.slice(0, -2)}${color.cyanBright("\u25B6")}  ${choice.selected ? color.green("\u25A0") : color.whiteBright("\u25A1")} ${color.underline(choice.label)} ${choice.hint ? color.dim(choice.hint) : ""}` : color[choice.selected ? "reset" : "dim"](
            `${prefix} ${choice.selected ? color.green("\u25A0") : "\u25A1"} ${choice.label} `
          )
        ).join("\n")
      );
      outputText.push(
        `

${prefix} Press ${color.inverse(" C ")} to continue`
      );
    }
    this.outputText = outputText.join("");
    this.out.write(import_sisteransi5.erase.line + import_sisteransi5.cursor.to(0) + this.outputText);
  }
};

// prompts-text.ts
var import_sisteransi6 = require("sisteransi");
var TextPrompt = class extends Prompt {
  transform;
  label;
  scale;
  msg;
  initial;
  hint;
  validator;
  errorMsg;
  cursor;
  cursorOffset;
  clear;
  done;
  error;
  red;
  outputError;
  name = "TextPrompt";
  // set by value setter, value is set in constructor
  _value;
  placeholder;
  rendered;
  // set by render which is called in constructor
  outputText;
  constructor(opts) {
    super(opts);
    this.transform = { render: (v) => v, scale: 1 };
    this.label = opts.label;
    this.scale = this.transform.scale;
    this.msg = opts.message;
    this.hint = opts.hint;
    this.initial = opts.initial || "";
    this.validator = opts.validate || (() => true);
    this.value = "";
    this.errorMsg = opts.error || "Please enter a valid value";
    this.cursor = Number(!!this.initial);
    this.cursorOffset = 0;
    this.clear = clear(``, this.out.columns);
    this.render();
  }
  get type() {
    return "text";
  }
  set value(v) {
    if (!v && this.initial) {
      this.placeholder = true;
      this.rendered = color.dim(this.initial);
    } else {
      this.placeholder = false;
      this.rendered = this.transform.render(v);
    }
    this._value = v;
    this.fire();
  }
  get value() {
    return this._value;
  }
  reset() {
    this.value = "";
    this.cursor = Number(!!this.initial);
    this.cursorOffset = 0;
    this.fire();
    this.render();
  }
  exit() {
    this.abort();
  }
  abort() {
    this.value = this.value || this.initial;
    this.done = this.aborted = true;
    this.error = false;
    this.red = false;
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  async validate() {
    let valid2 = await this.validator(this.value);
    if (typeof valid2 === `string`) {
      this.errorMsg = valid2;
      valid2 = false;
    }
    this.error = !valid2;
  }
  async submit() {
    this.value = this.value || this.initial;
    this.cursorOffset = 0;
    this.cursor = this.rendered.length;
    await this.validate();
    if (this.error) {
      this.red = true;
      this.fire();
      this.render();
      return;
    }
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }
  next() {
    if (!this.placeholder) return this.bell();
    this.value = this.initial;
    this.cursor = this.rendered.length;
    this.fire();
    this.render();
  }
  moveCursor(n) {
    if (this.placeholder) return;
    this.cursor = this.cursor + n;
    this.cursorOffset += n;
  }
  _(c, key) {
    let s1 = this.value.slice(0, this.cursor);
    let s2 = this.value.slice(this.cursor);
    this.value = `${s1}${c}${s2}`;
    this.red = false;
    this.cursor = this.placeholder ? 0 : s1.length + 1;
    this.render();
  }
  delete() {
    if (this.isCursorAtStart()) return this.bell();
    let s1 = this.value.slice(0, this.cursor - 1);
    let s2 = this.value.slice(this.cursor);
    this.value = `${s1}${s2}`;
    this.red = false;
    this.outputError = "";
    this.error = false;
    if (this.isCursorAtStart()) {
      this.cursorOffset = 0;
    } else {
      this.cursorOffset++;
      this.moveCursor(-1);
    }
    this.render();
  }
  deleteForward() {
    if (this.cursor * this.scale >= this.rendered.length || this.placeholder)
      return this.bell();
    let s1 = this.value.slice(0, this.cursor);
    let s2 = this.value.slice(this.cursor + 1);
    this.value = `${s1}${s2}`;
    this.red = false;
    this.outputError = "";
    this.error = false;
    if (this.isCursorAtEnd()) {
      this.cursorOffset = 0;
    } else {
      this.cursorOffset++;
    }
    this.render();
  }
  first() {
    this.cursor = 0;
    this.render();
  }
  last() {
    this.cursor = this.value.length;
    this.render();
  }
  left() {
    if (this.cursor <= 0 || this.placeholder) return this.bell();
    this.moveCursor(-1);
    this.render();
  }
  right() {
    if (this.cursor * this.scale >= this.rendered.length || this.placeholder)
      return this.bell();
    this.moveCursor(1);
    this.render();
  }
  isCursorAtStart() {
    return this.cursor === 0 || this.placeholder && this.cursor === 1;
  }
  isCursorAtEnd() {
    return this.cursor === this.rendered.length || this.placeholder && this.cursor === this.rendered.length + 1;
  }
  render() {
    if (this.closed) return;
    if (!this.firstRender) {
      if (this.outputError)
        this.out.write(
          import_sisteransi6.cursor.down(lines(this.outputError, this.out.columns) - 1) + clear(this.outputError, this.out.columns)
        );
      this.out.write(clear(this.outputText, this.out.columns));
    }
    super.render();
    this.outputError = "";
    let prefix = " ".repeat(strip(this.label).length);
    this.outputText = [
      "\n",
      this.label,
      " ",
      this.msg,
      this.done ? "" : this.hint ? (this.out.columns < 80 ? "\n" + " ".repeat(8) : "") + color.dim(` (${this.hint})`) : "",
      "\n" + prefix,
      " ",
      this.done ? color.dim(this.rendered) : this.rendered
    ].join("");
    if (this.error) {
      this.outputError += `  ${color.redBright(
        (shouldUseAscii() ? "> " : "\u25B6 ") + this.errorMsg
      )}`;
    }
    this.out.write(
      import_sisteransi6.erase.line + import_sisteransi6.cursor.to(0) + this.outputText + import_sisteransi6.cursor.save + this.outputError + import_sisteransi6.cursor.restore + import_sisteransi6.cursor.move(
        this.placeholder ? (this.rendered.length - 9) * -1 : this.cursorOffset,
        0
      )
    );
  }
};

// prompt.ts
var prompts = {
  text: (args) => toPrompt(TextPrompt, args),
  confirm: (args) => toPrompt(ConfirmPrompt, args),
  select: (args) => toPrompt(SelectPrompt, args),
  multiselect: (args) => toPrompt(MultiSelectPrompt, args)
};
async function prompt(questions, opts = {}) {
  let {
    onSubmit = identity,
    onCancel = () => import_node_process3.default.exit(0),
    stdin = import_node_process3.default.stdin,
    stdout = import_node_process3.default.stdout
  } = opts;
  let answers = {};
  let questionsArray = Array.isArray(questions) ? questions : [questions];
  let answer;
  let quit;
  let name;
  let type;
  for (let question of questionsArray) {
    ({ name, type } = question);
    try {
      answer = await prompts[type](Object.assign({ stdin, stdout }, question));
      answers[name] = answer;
      quit = await onSubmit(question, answer, answers);
    } catch (err) {
      quit = !await onCancel(question, answers);
    }
    if (quit) {
      return answers;
    }
  }
  return answers;
}
function toPrompt(el, args, opts = {}) {
  if (el !== TextPrompt && el !== ConfirmPrompt && el !== SelectPrompt && el !== MultiSelectPrompt) {
    throw new Error(`Invalid prompt type: ${el.name}`);
  }
  return new Promise((res, rej) => {
    let p = new el(
      args,
      // @ts-expect-error
      opts
    );
    let onAbort = args.onAbort || opts.onAbort || identity;
    let onSubmit = args.onSubmit || opts.onSubmit || identity;
    let onExit = args.onExit || opts.onExit || identity;
    p.on("state", args.onState || identity);
    p.on("submit", (x) => res(onSubmit(x)));
    p.on("exit", (x) => res(onExit(x)));
    p.on("abort", (x) => rej(onAbort(x)));
  });
}

// loading-indicator.ts
var import_node_process4 = __toESM(require("process"));
var import_node_readline2 = __toESM(require("readline"));
var import_sisteransi7 = require("sisteransi");
var GRADIENT_COLORS = [
  "#ffffff",
  "#dadada",
  "#dadada",
  "#a8deaa",
  "#a8deaa",
  "#a8deaa",
  "#d0f0bd",
  "#d0f0bd",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#ffffed",
  "#f7f8ca",
  "#f7f8ca",
  "#eae6ba",
  "#eae6ba",
  "#eae6ba",
  "#dadada",
  "#dadada",
  "#ffffff"
];
var MAX_FRAMES = 8;
var LEADING_FRAMES = Array.from(
  { length: MAX_FRAMES * 2 },
  () => GRADIENT_COLORS[0]
);
var TRAILING_FRAMES = Array.from(
  { length: MAX_FRAMES * 2 },
  () => GRADIENT_COLORS[GRADIENT_COLORS.length - 1]
);
var INDICATOR_FULL_FRAMES = [
  ...LEADING_FRAMES,
  ...GRADIENT_COLORS,
  ...TRAILING_FRAMES,
  ...reverse(GRADIENT_COLORS)
];
var INDICATOR_GRADIENT = reverse(
  INDICATOR_FULL_FRAMES.map((_, i) => loadingIndicatorFrame(i))
);
async function renderLoadingIndicator({
  start,
  end,
  while: update = () => sleep(100),
  noMotion = false,
  stdin = import_node_process4.default.stdin,
  stdout = import_node_process4.default.stdout
}) {
  let act = update();
  let tooSlow = /* @__PURE__ */ Object.create(null);
  let result = await Promise.race([sleep(500).then(() => tooSlow), act]);
  if (result === tooSlow) {
    let loading = await gradient(color.green(start), {
      stdin,
      stdout,
      noMotion
    });
    await act;
    loading.stop();
  }
  stdout.write(`${" ".repeat(5)} ${color.green("\u2714")}  ${color.green(end)}
`);
}
function loadingIndicatorFrame(offset = 0) {
  let frames = INDICATOR_FULL_FRAMES.slice(offset, offset + (MAX_FRAMES - 2));
  if (frames.length < MAX_FRAMES - 2) {
    let filled = new Array(MAX_FRAMES - frames.length - 2).fill(
      GRADIENT_COLORS[0]
    );
    frames.push(...filled);
  }
  return frames;
}
function getGradientAnimationFrames() {
  return INDICATOR_GRADIENT.map(
    (colors) => " " + colors.map((g, i) => color.hex(g)("\u2588")).join("")
  );
}
async function gradient(text, { stdin = import_node_process4.default.stdin, stdout = import_node_process4.default.stdout, noMotion = false } = {}) {
  let { createLogUpdate } = await import("log-update");
  let logUpdate = createLogUpdate(stdout);
  let frameIndex = 0;
  let frames = getGradientAnimationFrames();
  let interval;
  let rl = import_node_readline2.default.createInterface({ input: stdin, escapeCodeTimeout: 50 });
  import_node_readline2.default.emitKeypressEvents(stdin, rl);
  if (stdin.isTTY) stdin.setRawMode(true);
  function keypress(char) {
    if (char === "") {
      loadingIndicator2.stop();
      import_node_process4.default.exit(0);
    }
    if (stdin.isTTY) stdin.setRawMode(true);
    stdout.write(import_sisteransi7.cursor.hide + import_sisteransi7.erase.lines(1));
  }
  let done = false;
  let loadingIndicator2 = {
    start() {
      stdout.write(import_sisteransi7.cursor.hide);
      stdin.on("keypress", keypress);
      logUpdate(`${frames[0]}  ${text}`);
      async function loop() {
        if (done) return;
        if (frameIndex < frames.length - 1) {
          frameIndex++;
        } else {
          frameIndex = 0;
        }
        let frame = frames[frameIndex];
        logUpdate(
          `${(noMotion ? getMotionlessFrame(frameIndex) : color.supportsColor ? frame : getColorlessFrame(frameIndex)).padEnd(MAX_FRAMES - 1, " ")}  ${text}`
        );
        if (!done) await sleep(20);
        loop();
      }
      loop();
    },
    stop() {
      done = true;
      stdin.removeListener("keypress", keypress);
      clearInterval(interval);
      logUpdate.clear();
      rl.close();
    }
  };
  loadingIndicator2.start();
  return loadingIndicator2;
}
function getColorlessFrame(frameIndex) {
  return (frameIndex % 3 === 0 ? ".. .. " : frameIndex % 3 === 1 ? " .. .." : ". .. .").padEnd(MAX_FRAMES - 1 + 20, " ");
}
function getMotionlessFrame(frameIndex) {
  return " ".repeat(MAX_FRAMES - 1);
}

// copy-template.ts
var import_node_process5 = __toESM(require("process"));
var import_node_url = __toESM(require("url"));
var import_node_fs2 = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));
var import_node_stream = __toESM(require("stream"));
var import_node_util = require("util");
var import_web_fetch = require("@remix-run/web-fetch");
var import_gunzip_maybe = __toESM(require("gunzip-maybe"));
var import_tar_fs = __toESM(require("tar-fs"));
var import_proxy_agent = require("proxy-agent");
var defaultAgent = new import_proxy_agent.ProxyAgent();
var httpsAgent = new import_proxy_agent.ProxyAgent();
httpsAgent.protocol = "https:";
function agent(url2) {
  return new URL(url2).protocol === "https:" ? httpsAgent : defaultAgent;
}
async function copyTemplate(template, destPath, options) {
  let { log: log2 = () => {
  } } = options;
  try {
    if (isLocalFilePath(template)) {
      log2(`Using the template from local file at "${template}"`);
      let filepath = template.startsWith("file://") ? import_node_url.default.fileURLToPath(template) : template;
      let isLocalDir = await copyTemplateFromLocalFilePath(filepath, destPath);
      return isLocalDir ? { localTemplateDirectory: filepath } : void 0;
    }
    if (isGithubRepoShorthand(template)) {
      log2(`Using the template from the "${template}" repo`);
      await copyTemplateFromGithubRepoShorthand(template, destPath, options);
      return;
    }
    if (isValidGithubRepoUrl(template)) {
      log2(`Using the template from "${template}"`);
      await copyTemplateFromGithubRepoUrl(template, destPath, options);
      return;
    }
    if (isUrl(template)) {
      log2(`Using the template from "${template}"`);
      await copyTemplateFromGenericUrl(template, destPath, options);
      return;
    }
    throw new CopyTemplateError(
      `"${color.bold(template)}" is an invalid template. Run ${color.bold(
        "create-react-router --help"
      )} to see supported template formats.`
    );
  } catch (error2) {
    await options.onError(error2);
  }
}
function isLocalFilePath(input) {
  try {
    return input.startsWith("file://") || import_node_fs2.default.existsSync(
      import_node_path2.default.isAbsolute(input) ? input : import_node_path2.default.resolve(import_node_process5.default.cwd(), input)
    );
  } catch (_) {
    return false;
  }
}
async function copyTemplateFromRemoteTarball(url2, destPath, options) {
  return await downloadAndExtractTarball(destPath, url2, options);
}
async function copyTemplateFromGithubRepoShorthand(repoShorthand, destPath, options) {
  let [owner, name, ...path4] = repoShorthand.split("/");
  let filePath = path4.length ? path4.join("/") : null;
  await downloadAndExtractRepoTarball(
    { owner, name, filePath },
    destPath,
    options
  );
}
async function copyTemplateFromGithubRepoUrl(repoUrl, destPath, options) {
  await downloadAndExtractRepoTarball(getRepoInfo(repoUrl), destPath, options);
}
async function copyTemplateFromGenericUrl(url2, destPath, options) {
  await copyTemplateFromRemoteTarball(url2, destPath, options);
}
async function copyTemplateFromLocalFilePath(filePath, destPath) {
  if (filePath.endsWith(".tar.gz") || filePath.endsWith(".tgz")) {
    await extractLocalTarball(filePath, destPath);
    return false;
  }
  if (import_node_fs2.default.statSync(filePath).isDirectory()) {
    return true;
  }
  throw new CopyTemplateError(
    "The provided template is not a valid local directory or tarball."
  );
}
var pipeline = (0, import_node_util.promisify)(import_node_stream.default.pipeline);
async function extractLocalTarball(tarballPath, destPath) {
  try {
    await pipeline(
      import_node_fs2.default.createReadStream(tarballPath),
      (0, import_gunzip_maybe.default)(),
      import_tar_fs.default.extract(destPath, { strip: 1 })
    );
  } catch (error2) {
    throw new CopyTemplateError(
      `There was a problem extracting the file from the provided template.  Template filepath: \`${tarballPath}\`  Destination directory: \`${destPath}\`  ${error2}`
    );
  }
}
async function downloadAndExtractRepoTarball(repo, destPath, options) {
  if (repo.branch && repo.filePath) {
    let tarballURL = `https://codeload.github.com/${repo.owner}/${repo.name}/tar.gz/${repo.branch}`;
    return await downloadAndExtractTarball(destPath, tarballURL, {
      ...options,
      filePath: repo.filePath
    });
  }
  let url2 = `https://api.github.com/repos/${repo.owner}/${repo.name}/tarball`;
  if (repo.branch) {
    url2 += `/${repo.branch}`;
  }
  return await downloadAndExtractTarball(destPath, url2, {
    ...options,
    filePath: repo.filePath ?? null
  });
}
async function downloadAndExtractTarball(downloadPath, tarballUrl, { token, filePath }) {
  let resourceUrl = tarballUrl;
  let headers = {};
  let isGithubUrl = new URL(tarballUrl).host.endsWith("github.com");
  if (token && isGithubUrl) {
    headers.Authorization = `token ${token}`;
  }
  if (isGithubReleaseAssetUrl(tarballUrl)) {
    let info2 = getGithubReleaseAssetInfo(tarballUrl);
    headers.Accept = "application/vnd.github.v3+json";
    let releaseUrl = info2.tag === "latest" ? `https://api.github.com/repos/${info2.owner}/${info2.name}/releases/latest` : `https://api.github.com/repos/${info2.owner}/${info2.name}/releases/tags/${info2.tag}`;
    let response2 = await (0, import_web_fetch.fetch)(releaseUrl, {
      agent: agent("https://api.github.com"),
      headers
    });
    if (response2.status !== 200) {
      throw new CopyTemplateError(
        `There was a problem fetching the file from GitHub. The request responded with a ${response2.status} status. Please try again later.`
      );
    }
    let body = await response2.json();
    if (!body || typeof body !== "object" || !body.assets || !Array.isArray(body.assets)) {
      throw new CopyTemplateError(
        "There was a problem fetching the file from GitHub. No asset was found at that url. Please try again later."
      );
    }
    let assetId = body.assets.find((asset) => {
      return info2.tag === "latest" ? asset?.browser_download_url?.includes(info2.asset) : asset?.browser_download_url === tarballUrl;
    })?.id;
    if (assetId == null) {
      throw new CopyTemplateError(
        "There was a problem fetching the file from GitHub. No asset was found at that url. Please try again later."
      );
    }
    resourceUrl = `https://api.github.com/repos/${info2.owner}/${info2.name}/releases/assets/${assetId}`;
    headers.Accept = "application/octet-stream";
  }
  let response = await (0, import_web_fetch.fetch)(resourceUrl, {
    agent: agent(resourceUrl),
    headers
  });
  if (!response.body || response.status !== 200) {
    if (token) {
      throw new CopyTemplateError(
        `There was a problem fetching the file${isGithubUrl ? " from GitHub" : ""}. The request responded with a ${response.status} status. Perhaps your \`--token\`is expired or invalid.`
      );
    }
    throw new CopyTemplateError(
      `There was a problem fetching the file${isGithubUrl ? " from GitHub" : ""}. The request responded with a ${response.status} status. Please try again later.`
    );
  }
  if (filePath) {
    filePath = filePath.split(import_node_path2.default.sep).join(import_node_path2.default.posix.sep);
  }
  let filePathHasFiles = false;
  try {
    let input = new import_node_stream.default.PassThrough();
    writeReadableStreamToWritable(response.body, input);
    await pipeline(
      input,
      (0, import_gunzip_maybe.default)(),
      import_tar_fs.default.extract(downloadPath, {
        map(header) {
          let originalDirName = header.name.split("/")[0];
          header.name = header.name.replace(`${originalDirName}/`, "");
          if (filePath) {
            if (filePath.endsWith(import_node_path2.default.posix.sep) && header.name.startsWith(filePath) || !filePath.endsWith(import_node_path2.default.posix.sep) && header.name.startsWith(filePath + import_node_path2.default.posix.sep)) {
              filePathHasFiles = true;
              header.name = header.name.replace(filePath, "");
            } else {
              header.name = "__IGNORE__";
            }
          }
          return header;
        },
        ignore(_filename, header) {
          if (!header) {
            throw Error("Header is undefined");
          }
          return header.name === "__IGNORE__";
        }
      })
    );
  } catch (_) {
    throw new CopyTemplateError(
      `There was a problem extracting the file from the provided template.  Template URL: \`${tarballUrl}\`  Destination directory: \`${downloadPath}\``
    );
  }
  if (filePath && !filePathHasFiles) {
    throw new CopyTemplateError(
      `The path "${filePath}" was not found in this ${isGithubUrl ? "GitHub repo." : "tarball."}`
    );
  }
}
async function writeReadableStreamToWritable(stream2, writable) {
  let reader = stream2.getReader();
  let flushable = writable;
  try {
    while (true) {
      let { done, value } = await reader.read();
      if (done) {
        writable.end();
        break;
      }
      writable.write(value);
      if (typeof flushable.flush === "function") {
        flushable.flush();
      }
    }
  } catch (error2) {
    writable.destroy(error2);
    throw error2;
  }
}
function isValidGithubRepoUrl(input) {
  if (!isUrl(input)) {
    return false;
  }
  try {
    let url2 = new URL(input);
    let pathSegments = url2.pathname.slice(1).split("/");
    return url2.protocol === "https:" && url2.hostname === "github.com" && // The pathname must have at least 2 segments. If it has more than 2, the
    // third must be "tree" and it must have at least 4 segments.
    // https://github.com/:owner/:repo
    // https://github.com/:owner/:repo/tree/:ref
    pathSegments.length >= 2 && (pathSegments.length > 2 ? pathSegments[2] === "tree" && pathSegments.length >= 4 : true);
  } catch (_) {
    return false;
  }
}
function isGithubRepoShorthand(value) {
  if (isUrl(value)) {
    return false;
  }
  return /^[\w-]+\/[\w-.]+(\/[\w-.]+)*$/.test(value);
}
function isGithubReleaseAssetUrl(url2) {
  return url2.startsWith("https://github.com") && (url2.includes("/releases/download/") || url2.includes("/releases/latest/download/"));
}
function getGithubReleaseAssetInfo(browserUrl) {
  let url2 = new URL(browserUrl);
  let [, owner, name, , downloadOrLatest, tag, asset] = url2.pathname.split("/");
  if (downloadOrLatest === "latest" && tag === "download") {
    tag = "latest";
  }
  return {
    browserUrl,
    owner,
    name,
    asset,
    tag
  };
}
function getRepoInfo(validatedGithubUrl) {
  let url2 = new URL(validatedGithubUrl);
  let [, owner, name, tree, branch, ...file] = url2.pathname.split("/");
  let filePath = file.join("/");
  if (tree === void 0) {
    return {
      owner,
      name,
      branch: null,
      filePath: null
    };
  }
  return {
    owner,
    name,
    // If we've validated the GitHub URL and there is a tree, there will also be
    // a branch
    branch,
    filePath: filePath === "" || filePath === "/" ? null : filePath
  };
}
var CopyTemplateError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "CopyTemplateError";
  }
};

// index.ts
async function createReactRouter(argv2) {
  let ctx = await getContext(argv2);
  if (ctx.help) {
    printHelp(ctx);
    return;
  }
  if (ctx.versionRequested) {
    log(version);
    return;
  }
  let steps = [
    introStep,
    projectNameStep,
    copyTemplateToTempDirStep,
    copyTempDirToAppDirStep,
    gitInitQuestionStep,
    installDependenciesQuestionStep,
    installDependenciesStep,
    gitInitStep,
    doneStep
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
async function getContext(argv2) {
  let flags = (0, import_arg.default)(
    {
      "--debug": Boolean,
      "--react-router-version": String,
      "-v": "--react-router-version",
      "--template": String,
      "--token": String,
      "--yes": Boolean,
      "-y": "--yes",
      "--install": Boolean,
      "--no-install": Boolean,
      "--package-manager": String,
      "--show-install-output": Boolean,
      "--git-init": Boolean,
      "--no-git-init": Boolean,
      "--help": Boolean,
      "-h": "--help",
      "--version": Boolean,
      "--V": "--version",
      "--no-color": Boolean,
      "--no-motion": Boolean,
      "--overwrite": Boolean
    },
    { argv: argv2, permissive: true }
  );
  let {
    "--debug": debug2 = false,
    "--help": help = false,
    "--react-router-version": selectedReactRouterVersion,
    "--template": template,
    "--token": token,
    "--install": install,
    "--no-install": noInstall,
    "--package-manager": pkgManager,
    "--show-install-output": showInstallOutput = false,
    "--git-init": git,
    "--no-git-init": noGit,
    "--no-motion": noMotion,
    "--yes": yes,
    "--version": versionRequested,
    "--overwrite": overwrite
  } = flags;
  let cwd = flags["_"][0];
  let interactive = isInteractive();
  let projectName = cwd;
  if (!interactive) {
    yes = true;
  }
  if (selectedReactRouterVersion) {
    if (semver.valid(selectedReactRouterVersion)) {
    } else if (semver.coerce(selectedReactRouterVersion)) {
      selectedReactRouterVersion = semver.coerce(
        selectedReactRouterVersion
      ).version;
    } else {
      log(
        `
${color.warning(
          `${selectedReactRouterVersion} is an invalid version specifier. Using React Router v${version}.`
        )}`
      );
      selectedReactRouterVersion = void 0;
    }
  }
  let context = {
    tempDir: import_node_path3.default.join(
      await (0, import_promises2.realpath)(import_node_os2.default.tmpdir()),
      `create-react-router--${Math.random().toString(36).substr(2, 8)}`
    ),
    cwd,
    overwrite,
    interactive,
    debug: debug2,
    git: git ?? (noGit ? false : yes),
    help,
    install: install ?? (noInstall ? false : yes),
    showInstallOutput,
    noMotion,
    pkgManager: validatePackageManager(
      pkgManager ?? // npm, pnpm, Yarn, Bun and Deno (v2.0.5+) set the user agent environment variable that can be used
      // to determine which package manager ran the command.
      (import_node_process6.default.env.npm_config_user_agent ?? "npm").split("/")[0]
    ),
    projectName,
    prompt,
    reactRouterVersion: selectedReactRouterVersion || version,
    template,
    token,
    versionRequested
  };
  return context;
}
async function introStep(ctx) {
  log(
    `
${" ".repeat(9)}${color.green(
      color.bold("create-react-router")
    )} ${color.bold(`v${ctx.reactRouterVersion}`)}`
  );
  if (!ctx.interactive) {
    log("");
    info("Shell is not interactive.", [
      `Using default options. This is equivalent to running with the `,
      color.reset("--yes"),
      ` flag.`
    ]);
  }
}
async function projectNameStep(ctx) {
  if (!ctx.interactive && !ctx.cwd) {
    error("Oh no!", "No project directory provided");
    throw new Error("No project directory provided");
  }
  if (ctx.cwd) {
    await sleep(100);
    info("Directory:", [
      "Using ",
      color.reset(ctx.cwd),
      " as project directory"
    ]);
  }
  if (!ctx.cwd) {
    let { name: name2 } = await ctx.prompt({
      name: "name",
      type: "text",
      label: title("dir"),
      message: "Where should we create your new project?",
      initial: "./my-react-router-app"
    });
    ctx.cwd = name2;
    ctx.projectName = toValidProjectName(name2);
    return;
  }
  let name = ctx.cwd;
  if (name === "." || name === "./") {
    let parts = import_node_process6.default.cwd().split(import_node_path3.default.sep);
    name = parts[parts.length - 1];
  } else if (name.startsWith("./") || name.startsWith("../")) {
    let parts = name.split("/");
    name = parts[parts.length - 1];
  }
  ctx.projectName = toValidProjectName(name);
}
async function copyTemplateToTempDirStep(ctx) {
  if (ctx.template) {
    log("");
    info("Template:", ["Using ", color.reset(ctx.template), "..."]);
  } else {
    log("");
    info("Using default template", [
      "See https://github.com/remix-run/react-router-templates for more"
    ]);
  }
  let template = ctx.template ?? "https://github.com/remix-run/react-router-templates/tree/main/default";
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
            err instanceof CopyTemplateError ? err.message : "Something went wrong. Run `create-react-router --debug` to see more info.\n\nOpen an issue to report the problem at https://github.com/remix-run/react-router/issues/new"
          );
          throw err;
        },
        async log(message) {
          if (ctx.debug) {
            debug(message);
            await sleep(500);
          }
        }
      });
      if (result?.localTemplateDirectory) {
        ctx.tempDir = import_node_path3.default.resolve(result.localTemplateDirectory);
      }
    },
    ctx
  });
}
async function copyTempDirToAppDirStep(ctx) {
  await ensureDirectory(ctx.cwd);
  let files1 = await getDirectoryFilesRecursive(ctx.tempDir);
  let files2 = await getDirectoryFilesRecursive(ctx.cwd);
  let collisions = files1.filter((f) => files2.includes(f)).sort((a, b) => a.localeCompare(b));
  if (collisions.length > 0) {
    let getFileList = (prefix) => {
      let moreFiles = collisions.length - 5;
      let lines2 = ["", ...collisions.slice(0, 5)];
      if (moreFiles > 0) {
        lines2.push(`and ${moreFiles} more...`);
      }
      return lines2.join(`
${prefix}`);
    };
    if (ctx.overwrite) {
      info(
        "Overwrite:",
        `overwriting files due to \`--overwrite\`:${getFileList("           ")}`
      );
    } else if (!ctx.interactive) {
      error(
        "Oh no!",
        `Destination directory contains files that would be overwritten
         and no \`--overwrite\` flag was included in a non-interactive
         environment. The following files would be overwritten:` + getFileList("           ")
      );
      throw new Error(
        "File collisions detected in a non-interactive environment"
      );
    } else {
      if (ctx.debug) {
        debug(`Colliding files:${getFileList("          ")}`);
      }
      let { overwrite } = await ctx.prompt({
        name: "overwrite",
        type: "confirm",
        label: title("overwrite"),
        message: `Your project directory contains files that will be overwritten by
             this template (you can force with \`--overwrite\`)

             Files that would be overwritten:${getFileList("               ")}

             Do you wish to continue?
             `,
        initial: false
      });
      if (!overwrite) {
        throw new Error("Exiting to avoid overwriting files");
      }
    }
  }
  await (0, import_promises2.cp)(ctx.tempDir, ctx.cwd, {
    filter(src) {
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
    recursive: true
  });
  await updatePackageJSON(ctx);
}
async function installDependenciesQuestionStep(ctx) {
  if (ctx.install === void 0) {
    let { deps = true } = await ctx.prompt({
      name: "deps",
      type: "confirm",
      label: title("deps"),
      message: `Install dependencies with ${ctx.pkgManager}?`,
      hint: "recommended",
      initial: true
    });
    ctx.install = deps;
  }
}
async function installDependenciesStep(ctx) {
  let { install, pkgManager, showInstallOutput, cwd } = ctx;
  if (!install) {
    await sleep(100);
    info("Skipping install step.", [
      "Remember to install dependencies after setup with ",
      color.reset(`${pkgManager} install`),
      "."
    ]);
    return;
  }
  function runInstall() {
    return installDependencies({
      cwd,
      pkgManager,
      showInstallOutput
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
    ctx
  });
}
async function gitInitQuestionStep(ctx) {
  if ((0, import_node_fs3.existsSync)(import_node_path3.default.join(ctx.cwd, ".git"))) {
    info("Nice!", `Git has already been initialized`);
    return;
  }
  let git = ctx.git;
  if (ctx.git === void 0) {
    ({ git } = await ctx.prompt({
      name: "git",
      type: "confirm",
      label: title("git"),
      message: `Initialize a new git repository?`,
      hint: "recommended",
      initial: true
    }));
  }
  ctx.git = git ?? false;
}
async function gitInitStep(ctx) {
  if (!ctx.git) {
    return;
  }
  if ((0, import_node_fs3.existsSync)(import_node_path3.default.join(ctx.cwd, ".git"))) {
    log("");
    info("Nice!", `Git has already been initialized`);
    return;
  }
  log("");
  await loadingIndicator({
    start: "Git initializing...",
    end: "Git initialized",
    while: async () => {
      let options = { cwd: ctx.cwd, stdio: "ignore" };
      let commitMsg = "Initial commit from create-react-router";
      try {
        await (0, import_execa.default)("git", ["init"], options);
        await (0, import_execa.default)("git", ["add", "."], options);
        await (0, import_execa.default)("git", ["commit", "-m", commitMsg], options);
      } catch (err) {
        error("Oh no!", "Failed to initialize git.");
        throw err;
      }
    },
    ctx
  });
}
async function doneStep(ctx) {
  let projectDir = import_node_path3.default.relative(import_node_process6.default.cwd(), ctx.cwd);
  let max = import_node_process6.default.stdout.columns;
  let prefix = max < 80 ? " " : " ".repeat(9);
  await sleep(200);
  log(`
 ${color.bgWhite(color.black(" done "))}  That's it!`);
  await sleep(100);
  if (projectDir !== "") {
    let enter = [
      `
${prefix}Enter your project directory using`,
      color.cyan(`cd .${import_node_path3.default.sep}${projectDir}`)
    ];
    let len = enter[0].length + (0, import_strip_ansi.default)(enter[1]).length;
    log(enter.join(len > max ? "\n" + prefix : " "));
  }
  log(
    `${prefix}Check out ${color.bold(
      "README.md"
    )} for development and deploy instructions.`
  );
  await sleep(100);
  log(
    `
${prefix}Join the community at ${color.cyan(`https://rmx.as/discord`)}
`
  );
  await sleep(200);
}
var validPackageManagers = ["npm", "yarn", "pnpm", "bun", "deno"];
function validatePackageManager(pkgManager) {
  return validPackageManagers.find((name) => pkgManager === name) ?? "npm";
}
async function installDependencies({
  pkgManager,
  cwd,
  showInstallOutput
}) {
  try {
    await (0, import_execa.default)(pkgManager, ["install"], {
      cwd,
      stdio: showInstallOutput ? "inherit" : "ignore"
    });
  } catch (err) {
    error("Oh no!", "Failed to install dependencies.");
    throw err;
  }
}
async function updatePackageJSON(ctx) {
  let packageJSONPath = import_node_path3.default.join(ctx.cwd, "package.json");
  if (!(0, import_node_fs3.existsSync)(packageJSONPath)) {
    let relativePath = import_node_path3.default.relative(import_node_process6.default.cwd(), ctx.cwd);
    error(
      "Oh no!",
      `The provided template must be a React Router project with a \`package.json\` file, but that file does not exist in ${color.bold(relativePath)}.`
    );
    throw new Error(`package.json does not exist in ${ctx.cwd}`);
  }
  let contents = await (0, import_promises2.readFile)(packageJSONPath, "utf-8");
  let packageJSON;
  try {
    packageJSON = JSON.parse(contents);
    if (!isValidJsonObject(packageJSON)) {
      throw Error();
    }
  } catch (err) {
    error(
      "Oh no!",
      `The provided template must be a React Router project with a \`package.json\` file, but that file is invalid.`
    );
    throw err;
  }
  for (let pkgKey of ["dependencies", "devDependencies"]) {
    let dependencies = packageJSON[pkgKey];
    if (!dependencies) continue;
    if (!isValidJsonObject(dependencies)) {
      error(
        "Oh no!",
        `The provided template must be a React Router project with a \`package.json\` file, but its ${pkgKey} value is invalid.`
      );
      throw new Error(`package.json ${pkgKey} are invalid`);
    }
    for (let dependency in dependencies) {
      let version2 = dependencies[dependency];
      if ((dependency.startsWith("@react-router/") || dependency === "react-router" || dependency === "react-router-dom") && version2 === "*") {
        dependencies[dependency] = semver.prerelease(ctx.reactRouterVersion) ? (
          // Templates created from prereleases should pin to a specific version
          ctx.reactRouterVersion
        ) : "^" + ctx.reactRouterVersion;
      }
    }
  }
  packageJSON.name = ctx.projectName;
  (0, import_promises2.writeFile)(
    packageJSONPath,
    JSON.stringify((0, import_sort_package_json.default)(packageJSON), null, 2),
    "utf-8"
  );
}
async function loadingIndicator(args) {
  let { ctx, ...rest } = args;
  await renderLoadingIndicator({
    ...rest,
    noMotion: args.ctx.noMotion
  });
}
function title(text) {
  return align(color.bgWhite(` ${color.black(text)} `), "end", 7) + " ";
}
function printHelp(ctx) {
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
    "./path/to/template.tar.gz"
  ].reduce((str, example) => {
    return `${str}
${color.dim("$")} ${color.greenBright("create-react-router")} my-app ${color.arg(`--template ${example}`)}`;
  }, "")}

To create a new project from a template in a private GitHub repo,
pass the \`token\` flag with a personal access token with access
to that repo.
`;
  log(output);
}
function align(text, dir, len) {
  let pad = Math.max(len - strip(text).length, 0);
  switch (dir) {
    case "start":
      return text + " ".repeat(pad);
    case "end":
      return " ".repeat(pad) + text;
    case "center":
      return " ".repeat(Math.floor(pad / 2)) + text + " ".repeat(Math.floor(pad / 2));
    default:
      return text;
  }
}

// cli.ts
import_node_process7.default.on("SIGINT", () => import_node_process7.default.exit(0));
import_node_process7.default.on("SIGTERM", () => import_node_process7.default.exit(0));
var argv = import_node_process7.default.argv.slice(2).filter((arg2) => arg2 !== "--");
createReactRouter(argv).then(
  () => import_node_process7.default.exit(0),
  () => import_node_process7.default.exit(1)
);
/**
 * Adapted from https://github.com/withastro/cli-kit
 * @license MIT License Copyright (c) 2022 Nate Moore
 */
