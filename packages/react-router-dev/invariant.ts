export default function invariant(
  value: boolean,
  message?: string | undefined
): asserts value;

export default function invariant<T>(
  value: T | null | undefined,
  message?: string | undefined
): asserts value is T;

export default function invariant(value: any, message?: string | undefined) {
  if (value === false || value === null || typeof value === "undefined") {
    console.error(
      "The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose"
    );
    throw new Error(message);
  }
}
