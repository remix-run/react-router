/**
 * Adapted from https://github.com/withastro/cli-kit
 * @license MIT License Copyright (c) 2022 Nate Moore
 */
import { cursor, erase } from "sisteransi";

import { Prompt, type PromptOptions } from "./prompts-prompt-base";
import { color, strip, clear, shouldUseAscii, type ActionKey } from "./utils";

export interface SelectChoice {
  value: unknown;
  label: string;
  hint?: string;
}

export interface SelectPromptOptions<
  Choices extends Readonly<Readonly<SelectChoice>[]>
> extends PromptOptions {
  hint?: string;
  message: string;
  label: string;
  initial?: Choices[number]["value"] | undefined;
  validate?: (v: any) => boolean;
  error?: string;
  choices: Choices;
}

export class SelectPrompt<
  Choices extends Readonly<Readonly<SelectChoice>[]>
> extends Prompt {
  choices: Choices;
  label: string;
  msg: string;
  hint?: string;
  value: Choices[number]["value"] | undefined;
  initialValue: Choices[number]["value"];
  search: string | null;
  done: boolean | undefined;
  cursor: number;
  name = "SelectPrompt" as const;
  private _timeout: NodeJS.Timeout | undefined;

  // set by render which is called in constructor
  outputText!: string;

  constructor(opts: SelectPromptOptions<Choices>) {
    if (
      !opts.choices ||
      !Array.isArray(opts.choices) ||
      opts.choices.length < 1
    ) {
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
    return "select" as const;
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
    this.value = this.value || undefined;
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

  _(c: string, key: ActionKey) {
    if (this._timeout) clearTimeout(this._timeout);
    if (!Number.isNaN(Number.parseInt(c))) {
      let n = Number.parseInt(c) - 1;
      this.moveCursor(n);
      this.render();
      return this.submit();
    }
    this.search = this.search || "";
    this.search += c.toLowerCase();
    let choices = !this.search ? this.choices.slice(this.cursor) : this.choices;
    let n = choices.findIndex((c) =>
      c.label.toLowerCase().includes(this.search!)
    );
    if (n > -1) {
      this.moveCursor(n);
      this.render();
    }
    this._timeout = setTimeout(() => {
      this.search = null;
    }, 500);
  }

  moveCursor(n: number) {
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

  highlight(label: string) {
    if (!this.search) return label;
    let n = label.toLowerCase().indexOf(this.search.toLowerCase());
    if (n === -1) return label;
    return [
      label.slice(0, n),
      color.underline(label.slice(n, n + this.search.length)),
      label.slice(n + this.search.length),
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
      this.done
        ? ""
        : this.hint
        ? (this.out.columns < 80 ? "\n" + " ".repeat(8) : "") +
          color.dim(` (${this.hint})`)
        : "",
      "\n",
    ];

    let prefix = " ".repeat(strip(this.label).length);

    if (this.done) {
      outputText.push(
        `${prefix} `,
        color.dim(`${this.choices[this.cursor]?.label}`)
      );
    } else {
      outputText.push(
        this.choices
          .map((choice, i) =>
            i === this.cursor
              ? `${prefix} ${color.green(
                  shouldUseAscii() ? ">" : "●"
                )} ${this.highlight(choice.label)} ${
                  choice.hint ? color.dim(choice.hint) : ""
                }`
              : color.dim(
                  `${prefix} ${shouldUseAscii() ? "—" : "○"} ${choice.label} `
                )
          )
          .join("\n")
      );
    }
    this.outputText = outputText.join("");

    this.out.write(erase.line + cursor.to(0) + this.outputText);
  }
}
