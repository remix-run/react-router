// Adapted from https://github.com/withastro/cli-kit
// MIT License Copyright (c) 2022 Nate Moore
// https://github.com/withastro/cli-kit/tree/main/src/prompt
import process from "node:process";

import { ConfirmPrompt, type ConfirmPromptOptions } from "./prompts-confirm";
import {
  SelectPrompt,
  type SelectPromptOptions,
  type SelectChoice,
} from "./prompts-select";
import {
  MultiSelectPrompt,
  type MultiSelectPromptOptions,
} from "./prompts-multi-select";
import { TextPrompt, type TextPromptOptions } from "./prompts-text";
import { identity } from "./utils";

const prompts = {
  text: (args: TextPromptOptions) => toPrompt(TextPrompt, args),
  confirm: (args: ConfirmPromptOptions) => toPrompt(ConfirmPrompt, args),
  select: <Choices extends readonly Readonly<SelectChoice>[]>(
    args: SelectPromptOptions<Choices>
  ) => toPrompt(SelectPrompt, args),
  multiselect: <Choices extends readonly Readonly<SelectChoice>[]>(
    args: MultiSelectPromptOptions<Choices>
  ) => toPrompt(MultiSelectPrompt, args),
};

export async function prompt<
  T extends Readonly<PromptType<any>> | Readonly<PromptType<any>[]>,
  P extends T extends Readonly<any[]> ? T[number] : T = T extends Readonly<
    any[]
  >
    ? T[number]
    : T
>(questions: T, opts: PromptTypeOptions<P> = {}): Promise<Answers<T>> {
  let {
    onSubmit = identity,
    onCancel = () => process.exit(0),
    stdin = process.stdin,
    stdout = process.stdout,
  } = opts;

  let answers = {} as Answers<T>;

  let questionsArray = (
    Array.isArray(questions) ? questions : [questions]
  ) as Readonly<P[]>;
  let answer: Answer<P>;
  let quit: any;
  let name: string;
  let type: P["type"];

  for (let question of questionsArray) {
    ({ name, type } = question);

    try {
      // Get the injected answer if there is one or prompt the user
      // @ts-expect-error
      answer = await prompts[type](Object.assign({ stdin, stdout }, question));
      answers[name] = answer as any;
      quit = await onSubmit(question, answer, answers);
    } catch (err) {
      quit = !(await onCancel(question, answers));
    }
    if (quit) {
      return answers;
    }
  }
  return answers;
}

function toPrompt<
  T extends
    | typeof TextPrompt
    | typeof ConfirmPrompt
    | typeof SelectPrompt<any>
    | typeof MultiSelectPrompt<any>
>(el: T, args: any, opts: any = {}) {
  if (
    el !== TextPrompt &&
    el !== ConfirmPrompt &&
    el !== SelectPrompt &&
    el !== MultiSelectPrompt
  ) {
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
    p.on("submit", (x: any) => res(onSubmit(x)));
    p.on("exit", (x: any) => res(onExit(x)));
    p.on("abort", (x: any) => rej(onAbort(x)));
  });
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

interface BasePromptType {
  name: string;
}

interface TextPromptType extends BasePromptType {
  type: "text";
}

interface ConfirmPromptType extends BasePromptType {
  type: "confirm";
}

interface SelectPromptType<
  Choices extends Readonly<Readonly<SelectChoiceType>[]>
> extends BasePromptType {
  type: "select";
  choices: Choices;
}

interface MultiSelectPromptType<
  Choices extends Readonly<Readonly<SelectChoiceType>[]>
> extends BasePromptType {
  type: "multiselect";
  choices: Choices;
}

interface SelectChoiceType {
  value: unknown;
  label: string;
  hint?: string;
}

type PromptType<
  Choices extends Readonly<SelectChoiceType[]> = Readonly<SelectChoiceType[]>
> =
  | TextPromptType
  | ConfirmPromptType
  | SelectPromptType<Choices>
  | MultiSelectPromptType<Choices>;

type PromptChoices<T extends PromptType<any>> = T extends SelectPromptType<
  infer Choices
>
  ? Choices
  : T extends MultiSelectPromptType<infer Choices>
  ? Choices
  : never;

type Answer<
  T extends PromptType<any>,
  Choices extends Readonly<SelectChoiceType[]> = PromptChoices<T>
> = T extends TextPromptType
  ? string
  : T extends ConfirmPromptType
  ? boolean
  : T extends SelectPromptType<Choices>
  ? Choices[number]["value"]
  : T extends MultiSelectPromptType<Choices>
  ? (Choices[number]["value"] | undefined)[]
  : never;

type Answers<
  T extends Readonly<PromptType<any>> | Readonly<PromptType<any>[]>
> = T extends Readonly<PromptType<any>>
  ? Partial<{ [key in T["name"]]: Answer<T> }>
  : T extends Readonly<PromptType<any>[]>
  ? UnionToIntersection<Answers<T[number]>>
  : never;

interface PromptTypeOptions<
  T extends PromptType<any>,
  Choices extends Readonly<SelectChoiceType[]> = PromptChoices<T>
> {
  onSubmit?(
    question: T | Readonly<T>,
    answer: Answer<T, Choices>,
    answers: Answers<T>
  ): any;
  onCancel?(question: T | Readonly<T>, answers: Answers<T>): any;
  stdin?: NodeJS.ReadStream;
  stdout?: NodeJS.WriteStream;
}
