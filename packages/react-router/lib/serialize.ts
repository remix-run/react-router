import type { TypedResponse } from "@remix-run/router";
import type { Jsonify } from "./jsonify";

export type ArbitraryFunction = (...args: any[]) => unknown;

export type SerializeFrom<T extends ArbitraryFunction> = Jsonify<
  T extends (...args: any[]) => infer Output
    ? Awaited<Output> extends TypedResponse<infer U>
      ? U
      : Awaited<Output>
    : Awaited<T>
>;
