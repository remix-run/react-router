#!/usr/bin/env node
/**
 * create-react-router v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import process from "node:process";
import { spawn } from "node:child_process";
import fs, { existsSync } from "node:fs";
import { cp, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import url, { fileURLToPath } from "node:url";
import { parseArgs, promisify, stripVTControlCharacters } from "node:util";
import * as semver from "semver";
import sortPackageJSON from "sort-package-json";
import { beep, cursor, erase } from "sisteransi";
import EventEmitter from "node:events";
import readline from "node:readline";
import pc from "picocolors";
import stream from "node:stream";
import gunzip from "gunzip-maybe";
import tar from "tar-fs";
//#region utils.ts
const SUPPORTS_COLOR = pc.isColorSupported;
const color = {
	supportsColor: SUPPORTS_COLOR,
	heading: safeColor(pc.bold),
	arg: safeColor(pc.yellowBright),
	error: safeColor(pc.red),
	warning: safeColor(pc.yellow),
	hint: safeColor(pc.blue),
	bold: safeColor(pc.bold),
	black: safeColor(pc.black),
	white: safeColor(pc.white),
	blue: safeColor(pc.blue),
	cyan: safeColor(pc.cyan),
	red: safeColor(pc.red),
	yellow: safeColor(pc.yellow),
	green: safeColor(pc.green),
	blackBright: safeColor(pc.blackBright),
	whiteBright: safeColor(pc.whiteBright),
	blueBright: safeColor(pc.blueBright),
	cyanBright: safeColor(pc.cyanBright),
	redBright: safeColor(pc.redBright),
	yellowBright: safeColor(pc.yellowBright),
	greenBright: safeColor(pc.greenBright),
	bgBlack: safeColor(pc.bgBlack),
	bgWhite: safeColor(pc.bgWhite),
	bgBlue: safeColor(pc.bgBlue),
	bgCyan: safeColor(pc.bgCyan),
	bgRed: safeColor(pc.bgRed),
	bgYellow: safeColor(pc.bgYellow),
	bgGreen: safeColor(pc.bgGreen),
	bgBlackBright: safeColor(pc.bgBlackBright),
	bgWhiteBright: safeColor(pc.bgWhiteBright),
	bgBlueBright: safeColor(pc.bgBlueBright),
	bgCyanBright: safeColor(pc.bgCyanBright),
	bgRedBright: safeColor(pc.bgRedBright),
	bgYellowBright: safeColor(pc.bgYellowBright),
	bgGreenBright: safeColor(pc.bgGreenBright),
	gray: safeColor(pc.gray),
	dim: safeColor(pc.dim),
	reset: safeColor(pc.reset),
	inverse: safeColor(pc.inverse),
	hex: (hex) => safeColor(hexColor(hex)),
	underline: pc.underline
};
/**
* Converts a hex color string to an ANSI true-color (24-bit) formatter.
* Used by the loading indicator gradient animation.
*/
function hexColor(hex) {
	let h = hex.replace("#", "");
	let r = parseInt(h.substring(0, 2), 16);
	let g = parseInt(h.substring(2, 4), 16);
	let b = parseInt(h.substring(4, 6), 16);
	return (input) => `\x1b[38;2;${r};${g};${b}m${input}\x1b[39m`;
}
function safeColor(style) {
	return SUPPORTS_COLOR ? style : identity;
}
const unicode = { enabled: os.platform() !== "win32" };
const shouldUseAscii = () => !unicode.enabled;
function isInteractive() {
	if ("CREATE_REACT_ROUTER_FORCE_INTERACTIVE" in process.env) return true;
	return Boolean(process.stdout.isTTY && process.env.TERM !== "dumb" && !("CI" in process.env));
}
function log(message) {
	return process.stdout.write(message + "\n");
}
let stderr = process.stderr;
function logError(message) {
	return stderr.write(message + "\n");
}
function logBullet(logger, colorizePrefix, colorizeText, symbol, prefix, text) {
	let formattedText = (Array.isArray(text) ? text : [text || ""].filter(Boolean)).map((textPart) => colorizeText(textPart)).join("");
	if (process.stdout.columns < 80) {
		logger(`${" ".repeat(5)} ${colorizePrefix(symbol)}  ${colorizePrefix(prefix)}`);
		logger(`${" ".repeat(9)}${formattedText}`);
	} else logger(`${" ".repeat(5)} ${colorizePrefix(symbol)}  ${colorizePrefix(prefix)} ${formattedText}`);
}
function debug(prefix, text) {
	logBullet(log, color.yellow, color.dim, "●", prefix, text);
}
function info(prefix, text) {
	logBullet(log, color.cyan, color.dim, "◼", prefix, text);
}
function error(prefix, text) {
	log("");
	logBullet(logError, color.red, color.error, "▲", prefix, text);
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function toValidProjectName(projectName) {
	if (isValidProjectName(projectName)) return projectName;
	return projectName.trim().toLowerCase().replace(/\s+/g, "-").replace(/^[._]/, "").replace(/[^a-z\d\-~]+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
function isValidProjectName(projectName) {
	return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}
function identity(v) {
	return v;
}
function strip(str) {
	let pattern = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))"].join("|");
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
		return (await fs.promises.stat(p)).isDirectory();
	} catch {
		return false;
	}
}
async function ensureDirectory(dir) {
	if (!await directoryExists(dir)) await fs.promises.mkdir(dir, { recursive: true });
}
function isUrl(value) {
	try {
		new URL(value);
		return true;
	} catch (e) {
		return false;
	}
}
function clear(prompt, perLine) {
	if (!perLine) return erase.line + cursor.to(0);
	let rows = 0;
	let lines = prompt.split(/\r?\n/);
	for (let line of lines) rows += 1 + Math.floor(Math.max(strip(line).length - 1, 0) / perLine);
	return erase.lines(rows);
}
function lines(msg, perLine) {
	let lines = String(strip(msg) || "").split(/\r?\n/);
	if (!perLine) return lines.length;
	return lines.map((l) => Math.ceil(l.length / perLine)).reduce((a, b) => a + b);
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
	if (dir.endsWith(path.sep) && filePath.startsWith(dir) || !dir.endsWith(path.sep) && filePath.startsWith(dir + path.sep)) {
		stripped = filePath.slice(dir.length);
		if (stripped.startsWith(path.sep)) stripped = stripped.slice(1);
	}
	return stripped;
}
const IGNORED_TEMPLATE_DIRECTORIES = [".git", "node_modules"];
async function getDirectoryFilesRecursive(dir) {
	return (await readdir(dir, { recursive: true })).filter((file) => {
		let parts = file.split(path.sep);
		return parts.length <= 1 || !IGNORED_TEMPLATE_DIRECTORIES.includes(parts[0]);
	});
}
//#endregion
//#region prompts-prompt-base.ts
/**
* Adapted from https://github.com/withastro/cli-kit
* @license MIT License Copyright (c) 2022 Nate Moore
*/
var Prompt = class extends EventEmitter {
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
		this.in = opts.stdin || process.stdin;
		this.out = opts.stdout || process.stdout;
		this.onRender = (opts.onRender || (() => void 0)).bind(this);
		let rl = readline.createInterface({
			input: this.in,
			escapeCodeTimeout: 50
		});
		readline.emitKeypressEvents(this.in, rl);
		if (this.in.isTTY) this.in.setRawMode(true);
		let isSelect = ["SelectPrompt", "MultiSelectPrompt"].indexOf(this.constructor.name) > -1;
		let keypress = (str, key) => {
			if (this.in.isTTY) this.in.setRawMode(true);
			let a = action(key, isSelect);
			if (a === false) try {
				this._(str, key);
			} catch (e) {}
			else if (typeof this[a] === "function") this[a](key);
		};
		this.close = () => {
			this.out.write(cursor.show);
			this.in.removeListener("keypress", keypress);
			if (this.in.isTTY) this.in.setRawMode(false);
			rl.close();
			this.emit(this.aborted ? "abort" : this.exited ? "exit" : "submit", this.value);
			this.closed = true;
		};
		this.in.on("keypress", keypress);
	}
	get type() {
		throw new Error("Method type not implemented.");
	}
	bell() {
		this.out.write(beep);
	}
	fire() {
		this.emit("state", {
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
//#endregion
//#region prompts-confirm.ts
/**
* Adapted from https://github.com/withastro/cli-kit
* @license MIT License Copyright (c) 2022 Nate Moore
*/
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
	outputText;
	constructor(opts) {
		super(opts);
		this.label = opts.label;
		this.hint = opts.hint;
		this.msg = opts.message;
		this.value = opts.initial;
		this.initialValue = !!opts.initial;
		this.choices = [{
			value: true,
			label: "Yes"
		}, {
			value: false,
			label: "No"
		}];
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
		if (this.cursor === 0) this.moveCursor(this.choices.length - 1);
		else this.moveCursor(this.cursor - 1);
		this.render();
	}
	right() {
		if (this.cursor === this.choices.length - 1) this.moveCursor(0);
		else this.moveCursor(this.cursor + 1);
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
	}
	render() {
		if (this.closed) return;
		if (this.firstRender) this.out.write(cursor.hide);
		else this.out.write(clear(this.outputText, this.out.columns));
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
		if (this.done) outputText.push(" ", color.dim(`${this.choices[this.cursor].label}`));
		else outputText.push(" ", this.choices.map((choice, i) => i === this.cursor ? `${color.green("●")} ${choice.label} ` : color.dim(`○ ${choice.label} `)).join(color.dim(" ")));
		this.outputText = outputText.join("");
		this.out.write(erase.line + cursor.to(0) + this.outputText);
	}
};
//#endregion
//#region prompts-select.ts
/**
* Adapted from https://github.com/withastro/cli-kit
* @license MIT License Copyright (c) 2022 Nate Moore
*/
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
	outputText;
	constructor(opts) {
		if (!opts.choices || !Array.isArray(opts.choices) || opts.choices.length < 1) throw new Error("SelectPrompt must contain choices");
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
			let n = Number.parseInt(c) - 1;
			this.moveCursor(n);
			this.render();
			return this.submit();
		}
		this.search = this.search || "";
		this.search += c.toLowerCase();
		let n = (!this.search ? this.choices.slice(this.cursor) : this.choices).findIndex((c) => c.label.toLowerCase().includes(this.search));
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
		if (this.cursor === 0) this.moveCursor(this.choices.length - 1);
		else this.moveCursor(this.cursor - 1);
		this.render();
	}
	down() {
		if (this.cursor === this.choices.length - 1) this.moveCursor(0);
		else this.moveCursor(this.cursor + 1);
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
		if (this.firstRender) this.out.write(cursor.hide);
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
		if (this.done) outputText.push(`${prefix} `, color.dim(`${this.choices[this.cursor]?.label}`));
		else outputText.push(this.choices.map((choice, i) => i === this.cursor ? `${prefix} ${color.green(shouldUseAscii() ? ">" : "●")} ${this.highlight(choice.label)} ${choice.hint ? color.dim(choice.hint) : ""}` : color.dim(`${prefix} ${shouldUseAscii() ? "—" : "○"} ${choice.label} `)).join("\n"));
		this.outputText = outputText.join("");
		this.out.write(erase.line + cursor.to(0) + this.outputText);
	}
};
//#endregion
//#region prompts-multi-select.ts
/**
* Adapted from https://github.com/withastro/cli-kit
* @license MIT License Copyright (c) 2022 Nate Moore
*/
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
	outputText;
	constructor(opts) {
		if (!opts.choices || !Array.isArray(opts.choices) || opts.choices.length < 1) throw new Error("MultiSelectPrompt must contain choices");
		super(opts);
		this.label = opts.label;
		this.msg = opts.message;
		this.hint = opts.hint;
		this.value = [];
		this.choices = opts.choices.map((choice) => ({
			...choice,
			selected: false
		})) || [];
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
		if (c === " ") return this.toggle();
		if (c.toLowerCase() === "c") return this.finish();
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
		if (this.cursor === 0) this.moveCursor(this.choices.length - 1);
		else this.moveCursor(this.cursor - 1);
		this.render();
	}
	down() {
		if (this.cursor === this.choices.length - 1) this.moveCursor(0);
		else this.moveCursor(this.cursor + 1);
		this.render();
	}
	render() {
		if (this.closed) return;
		if (this.firstRender) this.out.write(cursor.hide);
		else this.out.write(clear(this.outputText, this.out.columns));
		super.render();
		let outputText = [
			"\n",
			this.label,
			" ",
			this.msg,
			"\n"
		];
		let prefix = " ".repeat(strip(this.label).length);
		if (this.done) outputText.push(this.choices.map((choice) => choice.selected ? `${prefix} ${color.dim(`${choice.label}`)}\n` : "").join("").trimEnd());
		else {
			outputText.push(this.choices.map((choice, i) => i === this.cursor ? `${prefix.slice(0, -2)}${color.cyanBright("▶")}  ${choice.selected ? color.green("■") : color.whiteBright("□")} ${color.underline(choice.label)} ${choice.hint ? color.dim(choice.hint) : ""}` : color[choice.selected ? "reset" : "dim"](`${prefix} ${choice.selected ? color.green("■") : "□"} ${choice.label} `)).join("\n"));
			outputText.push(`\n\n${prefix} Press ${color.inverse(" C ")} to continue`);
		}
		this.outputText = outputText.join("");
		this.out.write(erase.line + cursor.to(0) + this.outputText);
	}
};
//#endregion
//#region prompts-text.ts
/**
* Adapted from https://github.com/withastro/cli-kit
* @license MIT License Copyright (c) 2022 Nate Moore
*/
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
	_value;
	placeholder;
	rendered;
	outputText;
	constructor(opts) {
		super(opts);
		this.transform = {
			render: (v) => v,
			scale: 1
		};
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
		let valid = await this.validator(this.value);
		if (typeof valid === `string`) {
			this.errorMsg = valid;
			valid = false;
		}
		this.error = !valid;
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
		if (this.isCursorAtStart()) this.cursorOffset = 0;
		else {
			this.cursorOffset++;
			this.moveCursor(-1);
		}
		this.render();
	}
	deleteForward() {
		if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
		let s1 = this.value.slice(0, this.cursor);
		let s2 = this.value.slice(this.cursor + 1);
		this.value = `${s1}${s2}`;
		this.red = false;
		this.outputError = "";
		this.error = false;
		if (this.isCursorAtEnd()) this.cursorOffset = 0;
		else this.cursorOffset++;
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
		if (this.cursor * this.scale >= this.rendered.length || this.placeholder) return this.bell();
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
			if (this.outputError) this.out.write(cursor.down(lines(this.outputError, this.out.columns) - 1) + clear(this.outputError, this.out.columns));
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
		if (this.error) this.outputError += `  ${color.redBright((shouldUseAscii() ? "> " : "▶ ") + this.errorMsg)}`;
		this.out.write(erase.line + cursor.to(0) + this.outputText + cursor.save + this.outputError + cursor.restore + cursor.move(this.placeholder ? (this.rendered.length - 9) * -1 : this.cursorOffset, 0));
	}
};
//#endregion
//#region prompt.ts
const prompts = {
	text: (args) => toPrompt(TextPrompt, args),
	confirm: (args) => toPrompt(ConfirmPrompt, args),
	select: (args) => toPrompt(SelectPrompt, args),
	multiselect: (args) => toPrompt(MultiSelectPrompt, args)
};
async function prompt(questions, opts = {}) {
	let { onSubmit = identity, onCancel = () => process.exit(0), stdin = process.stdin, stdout = process.stdout } = opts;
	let answers = {};
	let questionsArray = Array.isArray(questions) ? questions : [questions];
	let answer;
	let quit;
	let name;
	let type;
	for (let question of questionsArray) {
		({name, type} = question);
		try {
			answer = await prompts[type](Object.assign({
				stdin,
				stdout
			}, question));
			answers[name] = answer;
			quit = await onSubmit(question, answer, answers);
		} catch (e) {
			quit = !await onCancel(question, answers);
		}
		if (quit) return answers;
	}
	return answers;
}
function toPrompt(el, args, opts = {}) {
	if (el !== TextPrompt && el !== ConfirmPrompt && el !== SelectPrompt && el !== MultiSelectPrompt) throw new Error(`Invalid prompt type: ${el.name}`);
	return new Promise((res, rej) => {
		let p = new el(args, opts);
		let onAbort = args.onAbort || opts.onAbort || identity;
		let onSubmit = args.onSubmit || opts.onSubmit || identity;
		let onExit = args.onExit || opts.onExit || identity;
		p.on("state", args.onState || identity);
		p.on("submit", (x) => res(onSubmit(x)));
		p.on("exit", (x) => res(onExit(x)));
		p.on("abort", (x) => rej(onAbort(x)));
	});
}
//#endregion
//#region loading-indicator.ts
const GRADIENT_COLORS = [
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
const MAX_FRAMES = 8;
const LEADING_FRAMES = Array.from({ length: MAX_FRAMES * 2 }, () => GRADIENT_COLORS[0]);
const TRAILING_FRAMES = Array.from({ length: MAX_FRAMES * 2 }, () => GRADIENT_COLORS[GRADIENT_COLORS.length - 1]);
const INDICATOR_FULL_FRAMES = [
	...LEADING_FRAMES,
	...GRADIENT_COLORS,
	...TRAILING_FRAMES,
	...reverse(GRADIENT_COLORS)
];
const INDICATOR_GRADIENT = reverse(INDICATOR_FULL_FRAMES.map((_, i) => loadingIndicatorFrame(i)));
async function renderLoadingIndicator({ start, end, while: update = () => sleep(100), noMotion = false, stdin = process.stdin, stdout = process.stdout }) {
	let act = update();
	let tooSlow = Object.create(null);
	if (await Promise.race([sleep(500).then(() => tooSlow), act]) === tooSlow) {
		let loading = await gradient(color.green(start), {
			stdin,
			stdout,
			noMotion
		});
		await act;
		loading.stop();
	}
	stdout.write(`${" ".repeat(5)} ${color.green("✔")}  ${color.green(end)}\n`);
}
function loadingIndicatorFrame(offset = 0) {
	let frames = INDICATOR_FULL_FRAMES.slice(offset, offset + (MAX_FRAMES - 2));
	if (frames.length < MAX_FRAMES - 2) {
		let filled = new Array(MAX_FRAMES - frames.length - 2).fill(GRADIENT_COLORS[0]);
		frames.push(...filled);
	}
	return frames;
}
function getGradientAnimationFrames() {
	return INDICATOR_GRADIENT.map((colors) => " " + colors.map((g, i) => color.hex(g)("█")).join(""));
}
async function gradient(text, { stdin = process.stdin, stdout = process.stdout, noMotion = false } = {}) {
	let { createLogUpdate } = await import("log-update");
	let logUpdate = createLogUpdate(stdout);
	let frameIndex = 0;
	let frames = getGradientAnimationFrames();
	let rl = readline.createInterface({
		input: stdin,
		escapeCodeTimeout: 50
	});
	readline.emitKeypressEvents(stdin, rl);
	if (stdin.isTTY) stdin.setRawMode(true);
	function keypress(char) {
		if (char === "") {
			loadingIndicator.stop();
			process.exit(0);
		}
		if (stdin.isTTY) stdin.setRawMode(true);
		stdout.write(cursor.hide + erase.lines(1));
	}
	let done = false;
	let loadingIndicator = {
		start() {
			stdout.write(cursor.hide);
			stdin.on("keypress", keypress);
			logUpdate(`${frames[0]}  ${text}`);
			async function loop() {
				if (done) return;
				if (frameIndex < frames.length - 1) frameIndex++;
				else frameIndex = 0;
				let frame = frames[frameIndex];
				logUpdate(`${(noMotion ? getMotionlessFrame(frameIndex) : color.supportsColor ? frame : getColorlessFrame(frameIndex)).padEnd(MAX_FRAMES - 1, " ")}  ${text}`);
				if (!done) await sleep(20);
				loop();
			}
			loop();
		},
		stop() {
			done = true;
			stdin.removeListener("keypress", keypress);
			logUpdate.clear();
			rl.close();
		}
	};
	loadingIndicator.start();
	return loadingIndicator;
}
function getColorlessFrame(frameIndex) {
	return (frameIndex % 3 === 0 ? ".. .. " : frameIndex % 3 === 1 ? " .. .." : ". .. .").padEnd(27, " ");
}
function getMotionlessFrame(frameIndex) {
	return " ".repeat(MAX_FRAMES - 1);
}
//#endregion
//#region copy-template.ts
async function copyTemplate(template, destPath, options) {
	let { log = () => {} } = options;
	/**
	* Valid templates are:
	* - local file or directory on disk
	* - GitHub owner/repo shorthand
	* - GitHub owner/repo/directory shorthand
	* - full GitHub repo URL
	* - any tarball URL
	*/
	try {
		if (isLocalFilePath(template)) {
			log(`Using the template from local file at "${template}"`);
			let filepath = template.startsWith("file://") ? url.fileURLToPath(template) : template;
			return await copyTemplateFromLocalFilePath(filepath, destPath) ? { localTemplateDirectory: filepath } : void 0;
		}
		if (isGithubRepoShorthand(template)) {
			log(`Using the template from the "${template}" repo`);
			await copyTemplateFromGithubRepoShorthand(template, destPath, options);
			return;
		}
		if (isValidGithubRepoUrl(template)) {
			log(`Using the template from "${template}"`);
			await copyTemplateFromGithubRepoUrl(template, destPath, options);
			return;
		}
		if (isUrl(template)) {
			log(`Using the template from "${template}"`);
			await copyTemplateFromGenericUrl(template, destPath, options);
			return;
		}
		throw new CopyTemplateError(`"${color.bold(template)}" is an invalid template. Run ${color.bold("create-react-router --help")} to see supported template formats.`);
	} catch (error) {
		await options.onError(error);
	}
}
function isLocalFilePath(input) {
	try {
		return input.startsWith("file://") || fs.existsSync(path.isAbsolute(input) ? input : path.resolve(process.cwd(), input));
	} catch (e) {
		return false;
	}
}
async function copyTemplateFromRemoteTarball(url, destPath, options) {
	return await downloadAndExtractTarball(destPath, url, options);
}
async function copyTemplateFromGithubRepoShorthand(repoShorthand, destPath, options) {
	let [owner, name, ...path] = repoShorthand.split("/");
	await downloadAndExtractRepoTarball({
		owner,
		name,
		filePath: path.length ? path.join("/") : null
	}, destPath, options);
}
async function copyTemplateFromGithubRepoUrl(repoUrl, destPath, options) {
	await downloadAndExtractRepoTarball(getRepoInfo(repoUrl), destPath, options);
}
async function copyTemplateFromGenericUrl(url, destPath, options) {
	await copyTemplateFromRemoteTarball(url, destPath, options);
}
async function copyTemplateFromLocalFilePath(filePath, destPath) {
	if (filePath.endsWith(".tar.gz") || filePath.endsWith(".tgz")) {
		await extractLocalTarball(filePath, destPath);
		return false;
	}
	if (fs.statSync(filePath).isDirectory()) return true;
	throw new CopyTemplateError("The provided template is not a valid local directory or tarball.");
}
const pipeline = promisify(stream.pipeline);
async function extractLocalTarball(tarballPath, destPath) {
	try {
		await pipeline(fs.createReadStream(tarballPath), gunzip(), tar.extract(destPath, { strip: 1 }));
	} catch (error) {
		throw new CopyTemplateError(`There was a problem extracting the file from the provided template.  Template filepath: \`${tarballPath}\`  Destination directory: \`${destPath}\`  ${error}`);
	}
}
async function downloadAndExtractRepoTarball(repo, destPath, options) {
	if (repo.branch && repo.filePath) return await downloadAndExtractTarball(destPath, `https://codeload.github.com/${repo.owner}/${repo.name}/tar.gz/${repo.branch}`, {
		...options,
		filePath: repo.filePath
	});
	let url = `https://api.github.com/repos/${repo.owner}/${repo.name}/tarball`;
	if (repo.branch) url += `/${repo.branch}`;
	return await downloadAndExtractTarball(destPath, url, {
		...options,
		filePath: repo.filePath ?? null
	});
}
async function downloadAndExtractTarball(downloadPath, tarballUrl, { token, filePath }) {
	let resourceUrl = tarballUrl;
	let headers = {};
	let isGithubUrl = new URL(tarballUrl).host.endsWith("github.com");
	if (token && isGithubUrl) headers.Authorization = `token ${token}`;
	if (isGithubReleaseAssetUrl(tarballUrl)) {
		let info = getGithubReleaseAssetInfo(tarballUrl);
		headers.Accept = "application/vnd.github.v3+json";
		let releaseUrl = info.tag === "latest" ? `https://api.github.com/repos/${info.owner}/${info.name}/releases/latest` : `https://api.github.com/repos/${info.owner}/${info.name}/releases/tags/${info.tag}`;
		let response = await fetch(releaseUrl, { headers });
		if (response.status !== 200) throw new CopyTemplateError(`There was a problem fetching the file from GitHub. The request responded with a ${response.status} status. Please try again later.`);
		let body = await response.json();
		if (!body || typeof body !== "object" || !body.assets || !Array.isArray(body.assets)) throw new CopyTemplateError("There was a problem fetching the file from GitHub. No asset was found at that url. Please try again later.");
		let assetId = body.assets.find((asset) => {
			return info.tag === "latest" ? asset?.browser_download_url?.includes(info.asset) : asset?.browser_download_url === tarballUrl;
		})?.id;
		if (assetId == null) throw new CopyTemplateError("There was a problem fetching the file from GitHub. No asset was found at that url. Please try again later.");
		resourceUrl = `https://api.github.com/repos/${info.owner}/${info.name}/releases/assets/${assetId}`;
		headers.Accept = "application/octet-stream";
	}
	let response = await fetch(resourceUrl, { headers });
	if (!response.body || response.status !== 200) {
		if (token) throw new CopyTemplateError(`There was a problem fetching the file${isGithubUrl ? " from GitHub" : ""}. The request responded with a ${response.status} status. Perhaps your \`--token\`is expired or invalid.`);
		throw new CopyTemplateError(`There was a problem fetching the file${isGithubUrl ? " from GitHub" : ""}. The request responded with a ${response.status} status. Please try again later.`);
	}
	if (filePath) filePath = filePath.split(path.sep).join(path.posix.sep);
	let filePathHasFiles = false;
	try {
		let input = new stream.PassThrough();
		writeReadableStreamToWritable(response.body, input);
		await pipeline(input, gunzip(), tar.extract(downloadPath, {
			map(header) {
				let originalDirName = header.name.split("/")[0];
				header.name = header.name.replace(`${originalDirName}/`, "");
				if (filePath) if (filePath.endsWith(path.posix.sep) && header.name.startsWith(filePath) || !filePath.endsWith(path.posix.sep) && header.name.startsWith(filePath + path.posix.sep)) {
					filePathHasFiles = true;
					header.name = header.name.replace(filePath, "");
				} else header.name = "__IGNORE__";
				return header;
			},
			ignore(_filename, header) {
				if (!header) throw Error("Header is undefined");
				return header.name === "__IGNORE__";
			}
		}));
	} catch (e) {
		throw new CopyTemplateError(`There was a problem extracting the file from the provided template.  Template URL: \`${tarballUrl}\`  Destination directory: \`${downloadPath}\``);
	}
	if (filePath && !filePathHasFiles) throw new CopyTemplateError(`The path "${filePath}" was not found in this ${isGithubUrl ? "GitHub repo." : "tarball."}`);
}
async function writeReadableStreamToWritable(stream, writable) {
	let reader = stream.getReader();
	let flushable = writable;
	try {
		while (true) {
			let { done, value } = await reader.read();
			if (done) {
				writable.end();
				break;
			}
			writable.write(value);
			if (typeof flushable.flush === "function") flushable.flush();
		}
	} catch (error) {
		writable.destroy(error);
		throw error;
	}
}
function isValidGithubRepoUrl(input) {
	if (!isUrl(input)) return false;
	try {
		let url = new URL(input);
		let pathSegments = url.pathname.slice(1).split("/");
		return url.protocol === "https:" && url.hostname === "github.com" && pathSegments.length >= 2 && (pathSegments.length > 2 ? pathSegments[2] === "tree" && pathSegments.length >= 4 : true);
	} catch (e) {
		return false;
	}
}
function isGithubRepoShorthand(value) {
	if (isUrl(value)) return false;
	return /^[\w-]+\/[\w-.]+(\/[\w-.]+)*$/.test(value);
}
function isGithubReleaseAssetUrl(url) {
	/**
	* Accounts for the following formats:
	* https://github.com/owner/repository/releases/download/v0.0.1/template.tar.gz
	* ~or~
	* https://github.com/owner/repository/releases/latest/download/template.tar.gz
	*/
	return url.startsWith("https://github.com") && (url.includes("/releases/download/") || url.includes("/releases/latest/download/"));
}
function getGithubReleaseAssetInfo(browserUrl) {
	let [, owner, name, , downloadOrLatest, tag, asset] = new URL(browserUrl).pathname.split("/");
	if (downloadOrLatest === "latest" && tag === "download") tag = "latest";
	return {
		browserUrl,
		owner,
		name,
		asset,
		tag
	};
}
function getRepoInfo(validatedGithubUrl) {
	let [, owner, name, tree, branch, ...file] = new URL(validatedGithubUrl).pathname.split("/");
	let filePath = file.join("/");
	if (tree === void 0) return {
		owner,
		name,
		branch: null,
		filePath: null
	};
	return {
		owner,
		name,
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
//#endregion
//#region package.json
var version = "8.2.0";
//#endregion
//#region index.ts
const currentFileDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.basename(currentFileDir) === "dist" ? path.dirname(currentFileDir) : currentFileDir;
const agentSkillPath = path.join(packageDir, "dist/agent-skills/react-router");
async function createReactRouter(argv) {
	let ctx = await getContext(argv);
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
		agentSkillsQuestionStep,
		copyAgentSkillsToAppDirStep,
		installDependenciesStep,
		gitInitStep,
		doneStep
	];
	try {
		for (let step of steps) await step(ctx);
	} catch (err) {
		if (ctx.debug) console.error(err);
		throw err;
	}
}
async function getContext(argv) {
	let { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		strict: false,
		options: {
			"agent-skills": { type: "boolean" },
			debug: { type: "boolean" },
			"git-init": { type: "boolean" },
			help: {
				type: "boolean",
				short: "h"
			},
			install: { type: "boolean" },
			"no-agent-skills": { type: "boolean" },
			"no-color": { type: "boolean" },
			"no-git-init": { type: "boolean" },
			"no-install": { type: "boolean" },
			"no-motion": { type: "boolean" },
			overwrite: { type: "boolean" },
			"package-manager": { type: "string" },
			"react-router-version": {
				type: "string",
				short: "v"
			},
			"show-install-output": { type: "boolean" },
			template: { type: "string" },
			token: { type: "string" },
			version: {
				type: "boolean",
				short: "V"
			},
			yes: {
				type: "boolean",
				short: "y"
			}
		}
	});
	let getBooleanArg = (value) => typeof value === "boolean" ? value : void 0;
	let getStringArg = (value) => typeof value === "string" ? value : void 0;
	let selectedReactRouterVersion = getStringArg(values["react-router-version"]);
	let yes = getBooleanArg(values.yes);
	let cwd = positionals[0];
	let interactive = isInteractive();
	let projectName = cwd;
	if (!interactive) yes = true;
	if (selectedReactRouterVersion) if (semver.valid(selectedReactRouterVersion)) {} else if (semver.coerce(selectedReactRouterVersion)) selectedReactRouterVersion = semver.coerce(selectedReactRouterVersion).version;
	else {
		log(`\n${color.warning(`${selectedReactRouterVersion} is an invalid version specifier. Using React Router v${version}.`)}`);
		selectedReactRouterVersion = void 0;
	}
	return {
		tempDir: path.join(await realpath(os.tmpdir()), `create-react-router--${Math.random().toString(36).substr(2, 8)}`),
		cwd,
		overwrite: getBooleanArg(values.overwrite),
		interactive,
		debug: getBooleanArg(values.debug) ?? false,
		agentSkills: getBooleanArg(values["agent-skills"]) ?? (getBooleanArg(values["no-agent-skills"]) ? false : yes),
		git: getBooleanArg(values["git-init"]) ?? (getBooleanArg(values["no-git-init"]) ? false : yes),
		help: getBooleanArg(values.help) ?? false,
		install: getBooleanArg(values.install) ?? (getBooleanArg(values["no-install"]) ? false : yes),
		showInstallOutput: getBooleanArg(values["show-install-output"]) ?? false,
		noMotion: getBooleanArg(values["no-motion"]),
		pkgManager: validatePackageManager(getStringArg(values["package-manager"]) ?? detectPackageManager() ?? "npm"),
		projectName,
		prompt,
		reactRouterVersion: selectedReactRouterVersion || version,
		template: getStringArg(values.template),
		token: getStringArg(values.token),
		versionRequested: getBooleanArg(values.version)
	};
}
async function introStep(ctx) {
	log(`\n${" ".repeat(9)}${color.green(color.bold("create-react-router"))} ${color.bold(`v${ctx.reactRouterVersion}`)}`);
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
		let { name } = await ctx.prompt({
			name: "name",
			type: "text",
			label: title("dir"),
			message: "Where should we create your new project?",
			initial: "./my-react-router-app"
		});
		ctx.cwd = name;
		ctx.projectName = toValidProjectName(name);
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
async function copyTemplateToTempDirStep(ctx) {
	if (ctx.template) {
		log("");
		info("Template:", [
			"Using ",
			color.reset(ctx.template),
			"..."
		]);
	} else {
		log("");
		info("Using default template", ["See https://github.com/remix-run/react-router-templates for more"]);
	}
	let template = ctx.template ?? "https://github.com/remix-run/react-router-templates/tree/main/default";
	await loadingIndicator({
		start: "Template copying...",
		end: "Template copied",
		while: async () => {
			await ensureDirectory(ctx.tempDir);
			if (ctx.debug) debug(`Extracting to: ${ctx.tempDir}`);
			let result = await copyTemplate(template, ctx.tempDir, {
				debug: ctx.debug,
				token: ctx.token,
				async onError(err) {
					error("Oh no!", err instanceof CopyTemplateError ? err.message : "Something went wrong. Run `create-react-router --debug` to see more info.\n\nOpen an issue to report the problem at https://github.com/remix-run/react-router/issues/new");
					throw err;
				},
				async log(message) {
					if (ctx.debug) {
						debug(message);
						await sleep(500);
					}
				}
			});
			if (result?.localTemplateDirectory) ctx.tempDir = path.resolve(result.localTemplateDirectory);
		},
		ctx
	});
}
async function agentSkillsQuestionStep(ctx) {
	if (ctx.agentSkills === void 0) {
		let { agentSkills = true } = await ctx.prompt({
			name: "agentSkills",
			type: "confirm",
			label: title("skill"),
			message: "Include the React Router agent skill?",
			hint: "recommended",
			initial: true
		});
		ctx.agentSkills = agentSkills;
	}
}
async function copyAgentSkillsToAppDirStep(ctx) {
	if (!ctx.agentSkills) {
		await sleep(100);
		info("Skipping agent skill.", [
			"You can add it later from ",
			color.reset("https://github.com/remix-run/react-router/tree/main/.agents/skills/react-router"),
			"."
		]);
		return;
	}
	if (!existsSync(path.join(agentSkillPath, "SKILL.md"))) {
		error("Oh no!", "React Router agent skill files were not found in this package.");
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
		recursive: true
	});
	info("Agent skill:", "Included React Router agent skill");
}
async function copyTempDirToAppDirStep(ctx) {
	await ensureDirectory(ctx.cwd);
	let files1 = await getDirectoryFilesRecursive(ctx.tempDir);
	let files2 = await getDirectoryFilesRecursive(ctx.cwd);
	let collisions = files1.filter((f) => files2.includes(f)).sort((a, b) => a.localeCompare(b));
	if (collisions.length > 0) {
		let getFileList = (prefix) => {
			let moreFiles = collisions.length - 5;
			let lines = ["", ...collisions.slice(0, 5)];
			if (moreFiles > 0) lines.push(`and ${moreFiles} more...`);
			return lines.join(`\n${prefix}`);
		};
		if (ctx.overwrite) info("Overwrite:", `overwriting files due to \`--overwrite\`:${getFileList("           ")}`);
		else if (!ctx.interactive) {
			error("Oh no!", "Destination directory contains files that would be overwritten\n         and no `--overwrite` flag was included in a non-interactive\n         environment. The following files would be overwritten:" + getFileList("           "));
			throw new Error("File collisions detected in a non-interactive environment");
		} else {
			if (ctx.debug) debug(`Colliding files:${getFileList("          ")}`);
			let { overwrite } = await ctx.prompt({
				name: "overwrite",
				type: "confirm",
				label: title("overwrite"),
				message: `Your project directory contains files that will be overwritten by
             this template (you can force with \`--overwrite\`)

             Files that would be overwritten:${getFileList("               ")}\n\n             Do you wish to continue?\n             `,
				initial: false
			});
			if (!overwrite) throw new Error("Exiting to avoid overwriting files");
		}
	}
	await cp(ctx.tempDir, ctx.cwd, {
		filter(src) {
			let file = stripDirectoryFromPath(ctx.tempDir, src);
			if (IGNORED_TEMPLATE_DIRECTORIES.includes(file)) {
				if (ctx.debug) debug(`Skipping copy of ${file} directory from template`);
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
	if (existsSync(path.join(ctx.cwd, ".git"))) {
		info("Nice!", `Git has already been initialized`);
		return;
	}
	let git = ctx.git;
	if (ctx.git === void 0) ({git} = await ctx.prompt({
		name: "git",
		type: "confirm",
		label: title("git"),
		message: `Initialize a new git repository?`,
		hint: "recommended",
		initial: true
	}));
	ctx.git = git ?? false;
}
async function gitInitStep(ctx) {
	if (!ctx.git) return;
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
			let options = {
				cwd: ctx.cwd,
				stdio: "ignore"
			};
			let commitMsg = "Initial commit from create-react-router";
			try {
				await runCommand("git", ["init"], options);
				await runCommand("git", ["add", "."], options);
				await runCommand("git", [
					"commit",
					"-m",
					commitMsg
				], options);
			} catch (err) {
				error("Oh no!", "Failed to initialize git.");
				throw err;
			}
		},
		ctx
	});
}
async function doneStep(ctx) {
	let projectDir = path.relative(process.cwd(), ctx.cwd);
	let max = process.stdout.columns;
	let prefix = max < 80 ? " " : " ".repeat(9);
	await sleep(200);
	log(`\n ${color.bgWhite(color.black(" done "))}  That's it!`);
	await sleep(100);
	if (projectDir !== "") {
		let enter = [`\n${prefix}Enter your project directory using`, color.cyan(`cd .${path.sep}${projectDir}`)];
		let len = enter[0].length + stripVTControlCharacters(enter[1]).length;
		log(enter.join(len > max ? "\n" + prefix : " "));
	}
	log(`${prefix}Check out ${color.bold("README.md")} for development and deploy instructions.`);
	await sleep(100);
	log(`\n${prefix}Join the community at ${color.cyan(`https://remix.run/discord`)}\n`);
	await sleep(200);
}
const validPackageManagers = [
	"npm",
	"yarn",
	"pnpm",
	"bun",
	"deno",
	"nub"
];
function validatePackageManager(pkgManager) {
	return validPackageManagers.find((name) => pkgManager === name) ?? "npm";
}
/**
* Determine which package manager the user prefers.
*
* npm, pnpm, Yarn, Bun, Deno, and nub set the user agent environment variable
* that can be used to determine which package manager ran the command.
*/
function detectPackageManager() {
	let { npm_config_user_agent } = process.env;
	if (!npm_config_user_agent) return void 0;
	try {
		let pkgManager = npm_config_user_agent.split("/")[0];
		if (pkgManager === "npm") return "npm";
		if (pkgManager === "pnpm") return "pnpm";
		if (pkgManager === "yarn") return "yarn";
		if (pkgManager === "bun") return "bun";
		if (pkgManager === "deno") return "deno";
		if (pkgManager === "nub") return "nub";
		return;
	} catch {
		return;
	}
}
async function installDependencies({ pkgManager, cwd, showInstallOutput }) {
	try {
		await runCommand(pkgManager, ["install"], {
			cwd,
			stdio: showInstallOutput ? "inherit" : "ignore"
		});
	} catch (err) {
		error("Oh no!", "Failed to install dependencies.");
		throw err;
	}
}
function runCommand(command, args, options) {
	return new Promise((resolve, reject) => {
		let child = spawn(command, args, options);
		child.on("error", reject);
		child.on("exit", (code, signal) => {
			if (code === 0) resolve();
			else reject(/* @__PURE__ */ new Error(signal ? `${command} exited with signal ${signal}` : `${command} exited with code ${code}`));
		});
	});
}
async function updatePackageJSON(ctx) {
	let packageJSONPath = path.join(ctx.cwd, "package.json");
	if (!existsSync(packageJSONPath)) {
		let relativePath = path.relative(process.cwd(), ctx.cwd);
		error("Oh no!", `The provided template must be a React Router project with a \`package.json\` file, but that file does not exist in ${color.bold(relativePath)}.`);
		throw new Error(`package.json does not exist in ${ctx.cwd}`);
	}
	let contents = await readFile(packageJSONPath, "utf-8");
	let packageJSON;
	try {
		packageJSON = JSON.parse(contents);
		if (!isValidJsonObject(packageJSON)) throw Error();
	} catch (err) {
		error("Oh no!", "The provided template must be a React Router project with a `package.json` file, but that file is invalid.");
		throw err;
	}
	for (let pkgKey of ["dependencies", "devDependencies"]) {
		let dependencies = packageJSON[pkgKey];
		if (!dependencies) continue;
		if (!isValidJsonObject(dependencies)) {
			error("Oh no!", `The provided template must be a React Router project with a \`package.json\` file, but its ${pkgKey} value is invalid.`);
			throw new Error(`package.json ${pkgKey} are invalid`);
		}
		for (let dependency in dependencies) {
			let version = dependencies[dependency];
			if ((dependency.startsWith("@react-router/") || dependency === "react-router") && version === "*") dependencies[dependency] = semver.prerelease(ctx.reactRouterVersion) ? ctx.reactRouterVersion : "^" + ctx.reactRouterVersion;
		}
	}
	packageJSON.name = ctx.projectName;
	writeFile(packageJSONPath, JSON.stringify(sortPackageJSON(packageJSON), null, 2), "utf-8");
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
	log(`
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
		"./path/to/template.tar.gz"
	].reduce((str, example) => {
		return `${str}\n${color.dim("$")} ${color.greenBright("create-react-router")} my-app ${color.arg(`--template ${example}`)}`;
	}, "")}

To create a new project from a template in a private GitHub repo,
pass the \`token\` flag with a personal access token with access
to that repo.
`);
}
function align(text, dir, len) {
	let pad = Math.max(len - strip(text).length, 0);
	switch (dir) {
		case "start": return text + " ".repeat(pad);
		case "end": return " ".repeat(pad) + text;
		case "center": return " ".repeat(Math.floor(pad / 2)) + text + " ".repeat(Math.floor(pad / 2));
		default: return text;
	}
}
//#endregion
//#region cli.ts
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
createReactRouter(process.argv.slice(2).filter((arg) => arg !== "--")).then(() => process.exit(0), () => process.exit(1));
//#endregion
export {};
