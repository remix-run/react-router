/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { NodePath } from "@babel/traverse";
import type { types as BabelTypes } from "@babel/core";
import { parse } from "@babel/parser";
import * as t from "@babel/types";

// These `require`s were needed to support building within vite-ecosystem-ci,
// otherwise we get errors that `traverse` and `generate` are not functions.
const traverse = require("@babel/traverse")
  .default as typeof import("@babel/traverse").default;
const generate = require("@babel/generator")
  .default as typeof import("@babel/generator").default;

export { traverse, generate, parse, t };
export type { BabelTypes, NodePath };
