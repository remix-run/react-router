/**
 * Adapted from https://github.com/withastro/cli-kit
 * @license MIT License Copyright (c) 2022 Nate Moore
 */
import { cursor, erase } from "sisteransi";

import { Prompt, type PromptOptions } from "./prompts-prompt-base";
import { type SelectChoice } from "./prompts-select";
import { color, strip, clear, type ActionKey } from "./utils";

export interface MultiSelectPromptOptions<
  Choices extends Readonly<Readonly<SelectChoice>[]>
> extends PromptOptions {
  hint?: string;
  message: string;
  label: string;
  initial?: Choices[number]["value"];
  validate?: (v: any) => boolean;
  error?: string;
  choices: Choices;
}

export class MultiSelectPrompt<
  Choices extends Readonly<Readonly<SelectChoice>[]>
> extends Prompt {
  choices: Readonly<Array<Choices[number] & { selected: boolean }>>;
  label: string;
  msg: string;
  hint?: string;
  value: Array<Choices[number]["value"]>;
  initialValue: Choices[number]["value"];
  done: boolean | undefined;
  cursor: number;
  name = "MultiSelectPrompt" as const;

  // set by render which is called in constructor
  outputText!: string;

  constructor(opts: MultiSelectPromptOptions<Choices>) {
    if (
      !opts.choices ||
      !Array.isArray(opts.choices) ||
      opts.choices.length < 1
    ) {
      throw new Error("MultiSelectPrompt must contain choices");
    }
    super(opts);
    this.label = opts.label;
    this.msg = opts.message;
    this.hint = opts.hint;
    this.value = [];
    this.choices =
      opts.choices.map((choice) => ({ ...choice, selected: false })) || [];
    this.initialValue = opts.initial || this.choices[0].value;
    this.cursor = this.choices.findIndex((c) => c.value === this.initialValue);
    this.render();
  }

  get type() {
    return "multiselect" as const;
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
    // eslint-disable-next-line no-self-assign
    this.value = this.value;
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write("\n");
    this.close();
  }

  moveCursor(n: number) {
    this.cursor = n;
    this.fire();
  }

  toggle() {
    let choice = this.choices[this.cursor];
    if (!choice) return;
    choice.selected = !choice.selected;
    this.render();
  }

  _(c: string, key: ActionKey) {
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
      this.out.write(cursor.hide);
    } else {
      this.out.write(clear(this.outputText, this.out.columns));
    }
    super.render();

    let outputText = ["\n", this.label, " ", this.msg, "\n"];

    let prefix = " ".repeat(strip(this.label).length);

    if (this.done) {
      outputText.push(
        this.choices
          .map((choice) =>
            choice.selected ? `${prefix} ${color.dim(`${choice.label}`)}\n` : ""
          )
          .join("")
          .trimEnd()
      );
    } else {
      outputText.push(
        this.choices
          .map((choice, i) =>
            i === this.cursor
              ? `${prefix.slice(0, -2)}${color.cyanBright("▶")}  ${
                  choice.selected ? color.green("■") : color.whiteBright("□")
                } ${color.underline(choice.label)} ${
                  choice.hint ? color.dim(choice.hint) : ""
                }`
              : color[choice.selected ? "reset" : "dim"](
                  `${prefix} ${choice.selected ? color.green("■") : "□"} ${
                    choice.label
                  } `
                )
          )
          .join("\n")
      );
      outputText.push(
        `\n\n${prefix} Press ${color.inverse(" C ")} to continue`
      );
    }
    this.outputText = outputText.join("");
    this.out.write(erase.line + cursor.to(0) + this.outputText);
  }
}
