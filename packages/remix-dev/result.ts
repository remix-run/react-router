type Ok<V> = { ok: true; value: V };
type Err<E = unknown> = { ok: false; error: E };

export type Result<V, E = unknown> = Ok<V> | Err<E>;

export let ok = <V>(value: V): Ok<V> => ({ ok: true, value });
export let err = <E = unknown>(error: E): Err<E> => ({ ok: false, error });
