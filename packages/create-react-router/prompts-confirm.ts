/**
 * Adapted from https://github.com/withastro/cli-kit
 * @license MIT License Copyright (c) 2022 Nate Moore
 */
import { cursor, erase } from "sisteransi";

import { Prompt, type PromptOptions } from "./prompts-prompt-base";
import { color, strip, clear, type ActionKey } from "./utils";

export interface ConfirmPromptOptions extends PromptOptions {
  label: string;
  message: string;
  initial?: boolean;
  hint?: string;
  validate?: (v: any) => boolean;
  error?: string;
}

export type ConfirmPromptChoices = [
  { value: true; label: string },
  { value: false; label: string }
];

export class ConfirmPrompt extends Prompt {
  label: string;
  msg: string;
  value: boolean | undefined;
  initialValue: boolean;
  hint?: string;
  choices: ConfirmPromptChoices;
  cursor: number;
  done: boolean | undefined;
  name = "ConfirmPrompt" as const;

  // set by render which is called in constructor
  outputText!: string;

  constructor(opts: ConfirmPromptOptions) {
    super(opts);
    this.label = opts.label;
    this.hint = opts.hint;
    this.msg = opts.message;
    this.value = opts.initial;
    this.initialValue = !!opts.initial;
    this.choices = [
      { value: true, label: "Yes" },
      { value: false, label: "No" },
    ];
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue);
    this.render();
  }

  get type() {
    return "confirm" as const;
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

  _(c: string, key: ActionKey) {
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
      this.out.write(cursor.hide);
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
      "\n",
    ];

    outputText.push(" ".repeat(strip(this.label).length));

    if (this.done) {
      outputText.push(" ", color.dim(`${this.choices[this.cursor].label}`));
    } else {
      outputText.push(
        " ",
        this.choices
          .map((choice, i) =>
            i === this.cursor
              ? `${color.green("●")} ${choice.label} `
              : color.dim(`○ ${choice.label} `)
          )
          .join(color.dim(" "))
      );
    }
    this.outputText = outputText.join("");

    this.out.write(erase.line + cursor.to(0) + this.outputText);
  }
}
