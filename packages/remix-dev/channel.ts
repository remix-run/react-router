import type { Result } from "./result";

type Resolve<V> = (value: V | PromiseLike<V>) => void;
type Reject = (reason?: any) => void;

export type Type<V, E = unknown> = {
  ok: (value: V) => void;
  err: (reason?: any) => void;
  result: Promise<Result<V, E>>;
};

export const create = <V, E = unknown>(): Type<V, E> => {
  let _resolve: Resolve<{ ok: true; value: V }>;
  let _reject: Reject;

  let promise: Promise<Result<V, E>> = new Promise<Result<V, E>>(
    (resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    }
  ).catch((error) => ({ ok: false, error } as const));

  return {
    ok: (value: V) => _resolve!({ ok: true, value } as const),
    err: _reject!,
    result: promise,
  };
};
