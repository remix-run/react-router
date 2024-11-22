/**
 * Adapted from https://github.com/withastro/cli-kit
 * @license MIT License Copyright (c) 2022 Nate Moore
 */
import process from "node:process";
import EventEmitter from "node:events";
import readline from "node:readline";
import { beep, cursor } from "sisteransi";

import { color, action, type ActionKey } from "./utils";

export class Prompt extends EventEmitter {
  firstRender: boolean;
  in: any;
  out: any;
  onRender: any;
  close: () => void;
  aborted: any;
  exited: any;
  closed: boolean | undefined;
  name = "Prompt";

  constructor(opts: PromptOptions = {}) {
    super();
    this.firstRender = true;
    this.in = opts.stdin || process.stdin;
    this.out = opts.stdout || process.stdout;
    this.onRender = (opts.onRender || (() => void 0)).bind(this);
    let rl = readline.createInterface({
      input: this.in,
      escapeCodeTimeout: 50,
    });
    readline.emitKeypressEvents(this.in, rl);

    if (this.in.isTTY) this.in.setRawMode(true);
    let isSelect =
      ["SelectPrompt", "MultiSelectPrompt"].indexOf(this.constructor.name) > -1;

    let keypress = (str: string, key: ActionKey) => {
      if (this.in.isTTY) this.in.setRawMode(true);
      let a = action(key, isSelect);
      if (a === false) {
        try {
          this._(str, key);
        } catch (_) {}
        // @ts-expect-error
      } else if (typeof this[a] === "function") {
        // @ts-expect-error
        this[a](key);
      }
    };

    this.close = () => {
      this.out.write(cursor.show);
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

  get type(): string {
    throw new Error("Method type not implemented.");
  }

  bell() {
    this.out.write(beep);
  }

  fire() {
    this.emit("state", {
      // @ts-expect-error
      value: this.value,
      aborted: !!this.aborted,
      exited: !!this.exited,
    });
  }

  render() {
    this.onRender(color);
    if (this.firstRender) this.firstRender = false;
  }

  _(c: string, key: ActionKey) {
    throw new Error("Method _ not implemented.");
  }
}

export interface PromptOptions {
  stdin?: typeof process.stdin;
  stdout?: typeof process.stdout;
  onRender?(render: (...text: unknown[]) => string): void;
  onSubmit?(
    v: any
  ): void | undefined | boolean | Promise<void | undefined | boolean>;
  onCancel?(
    v: any
  ): void | undefined | boolean | Promise<void | undefined | boolean>;
  onAbort?(
    v: any
  ): void | undefined | boolean | Promise<void | undefined | boolean>;
  onExit?(
    v: any
  ): void | undefined | boolean | Promise<void | undefined | boolean>;
  onState?(
    v: any
  ): void | undefined | boolean | Promise<void | undefined | boolean>;
}
