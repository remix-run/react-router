import {
  HOLE,
  NAN,
  NEGATIVE_INFINITY,
  NEGATIVE_ZERO,
  NULL,
  POSITIVE_INFINITY,
  UNDEFINED,
  TYPE_BIGINT,
  TYPE_DATE,
  TYPE_ERROR,
  TYPE_MAP,
  TYPE_NULL_OBJECT,
  TYPE_PROMISE,
  TYPE_REGEXP,
  TYPE_SET,
  TYPE_SYMBOL,
  TYPE_URL,
  type ThisEncode,
} from "./utils";

const TIME_LIMIT_MS = 1;
const getNow = () => Date.now();
const yieldToMain = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

export async function flatten(
  this: ThisEncode,
  input: unknown,
): Promise<number | [number]> {
  const { indices } = this;
  const existing = indices.get(input);
  if (existing) return [existing];

  if (input === undefined) return UNDEFINED;
  if (input === null) return NULL;
  if (Number.isNaN(input)) return NAN;
  if (input === Number.POSITIVE_INFINITY) return POSITIVE_INFINITY;
  if (input === Number.NEGATIVE_INFINITY) return NEGATIVE_INFINITY;
  if (input === 0 && 1 / input < 0) return NEGATIVE_ZERO;

  const index = this.index++;
  indices.set(input, index);

  const stack: [unknown, number][] = [[input, index]];
  await stringify.call(this, stack);

  return index;
}

async function stringify(this: ThisEncode, stack: [unknown, number][]) {
  const { deferred, indices, plugins, postPlugins } = this;
  const str = this.stringified;

  let lastYieldTime = getNow();

  // Helper to assign index and schedule for processing if needed
  const flattenValue = (value: unknown): number | [number] => {
    const existing = indices.get(value);
    if (existing) return [existing];

    if (value === undefined) return UNDEFINED;
    if (value === null) return NULL;
    if (Number.isNaN(value)) return NAN;
    if (value === Number.POSITIVE_INFINITY) return POSITIVE_INFINITY;
    if (value === Number.NEGATIVE_INFINITY) return NEGATIVE_INFINITY;
    if (value === 0 && 1 / value < 0) return NEGATIVE_ZERO;

    const index = this.index++;
    indices.set(value, index);
    stack.push([value, index]);
    return index;
  };

  let i = 0;
  while (stack.length > 0) {
    // Yield to main thread if time limit exceeded
    const now = getNow();
    if (++i % 6000 === 0 && now - lastYieldTime >= TIME_LIMIT_MS) {
      await yieldToMain();
      lastYieldTime = getNow();
    }

    const [input, index] = stack.pop()!;

    const partsForObj = (obj: any) =>
      Object.keys(obj)
        .map((k) => `"_${flattenValue(k)}":${flattenValue(obj[k])}`)
        .join(",");
    let error: Error | null = null;

    switch (typeof input) {
      case "boolean":
      case "number":
      case "string":
        str[index] = JSON.stringify(input);
        break;
      case "bigint":
        str[index] = `["${TYPE_BIGINT}","${input}"]`;
        break;
      case "symbol": {
        const keyFor = Symbol.keyFor(input);
        if (!keyFor) {
          error = new Error(
            "Cannot encode symbol unless created with Symbol.for()",
          );
        } else {
          str[index] = `["${TYPE_SYMBOL}",${JSON.stringify(keyFor)}]`;
        }
        break;
      }
      case "object": {
        if (!input) {
          str[index] = `${NULL}`;
          break;
        }

        const isArray = Array.isArray(input);
        let pluginHandled = false;
        if (!isArray && plugins) {
          for (const plugin of plugins) {
            const pluginResult = plugin(input);
            if (Array.isArray(pluginResult)) {
              pluginHandled = true;
              const [pluginIdentifier, ...rest] = pluginResult;
              str[index] = `[${JSON.stringify(pluginIdentifier)}`;
              if (rest.length > 0) {
                str[index] += `,${rest.map((v) => flattenValue(v)).join(",")}`;
              }
              str[index] += "]";
              break;
            }
          }
        }

        if (!pluginHandled) {
          let result = isArray ? "[" : "{";
          if (isArray) {
            for (let i = 0; i < input.length; i++)
              result +=
                (i ? "," : "") + (i in input ? flattenValue(input[i]) : HOLE);
            str[index] = `${result}]`;
          } else if (input instanceof Date) {
            const dateTime = input.getTime();
            str[index] = `["${TYPE_DATE}",${
              Number.isNaN(dateTime) ? JSON.stringify("invalid") : dateTime
            }]`;
          } else if (input instanceof URL) {
            str[index] = `["${TYPE_URL}",${JSON.stringify(input.href)}]`;
          } else if (input instanceof RegExp) {
            str[index] = `["${TYPE_REGEXP}",${JSON.stringify(
              input.source,
            )},${JSON.stringify(input.flags)}]`;
          } else if (input instanceof Set) {
            if (input.size > 0) {
              str[index] = `["${TYPE_SET}",${[...input]
                .map((val) => flattenValue(val))
                .join(",")}]`;
            } else {
              str[index] = `["${TYPE_SET}"]`;
            }
          } else if (input instanceof Map) {
            if (input.size > 0) {
              str[index] = `["${TYPE_MAP}",${[...input]
                .flatMap(([k, v]) => [flattenValue(k), flattenValue(v)])
                .join(",")}]`;
            } else {
              str[index] = `["${TYPE_MAP}"]`;
            }
          } else if (input instanceof Promise) {
            str[index] = `["${TYPE_PROMISE}",${index}]`;
            deferred[index] = input;
          } else if (input instanceof Error) {
            str[index] = `["${TYPE_ERROR}",${JSON.stringify(input.message)}`;
            if (input.name !== "Error") {
              str[index] += `,${JSON.stringify(input.name)}`;
            }
            str[index] += "]";
          } else if (Object.getPrototypeOf(input) === null) {
            str[index] = `["${TYPE_NULL_OBJECT}",{${partsForObj(input)}}]`;
          } else if (isPlainObject(input)) {
            str[index] = `{${partsForObj(input)}}`;
          } else {
            error = new Error("Cannot encode object with prototype");
          }
        }
        break;
      }
      default: {
        const isArray = Array.isArray(input);
        let pluginHandled = false;
        if (!isArray && plugins) {
          for (const plugin of plugins) {
            const pluginResult = plugin(input);
            if (Array.isArray(pluginResult)) {
              pluginHandled = true;
              const [pluginIdentifier, ...rest] = pluginResult;
              str[index] = `[${JSON.stringify(pluginIdentifier)}`;
              if (rest.length > 0) {
                str[index] += `,${rest.map((v) => flattenValue(v)).join(",")}`;
              }
              str[index] += "]";
              break;
            }
          }
        }

        if (!pluginHandled) {
          error = new Error("Cannot encode function or unexpected type");
        }
      }
    }

    if (error) {
      let pluginHandled = false;

      if (postPlugins) {
        for (const plugin of postPlugins) {
          const pluginResult = plugin(input);
          if (Array.isArray(pluginResult)) {
            pluginHandled = true;
            const [pluginIdentifier, ...rest] = pluginResult;
            str[index] = `[${JSON.stringify(pluginIdentifier)}`;
            if (rest.length > 0) {
              str[index] += `,${rest.map((v) => flattenValue(v)).join(",")}`;
            }
            str[index] += "]";
            break;
          }
        }
      }

      if (!pluginHandled) {
        throw error;
      }
    }
  }
}

const objectProtoNames = Object.getOwnPropertyNames(Object.prototype)
  .sort()
  .join("\0");

function isPlainObject(
  thing: unknown,
): thing is Record<string | number | symbol, unknown> {
  const proto = Object.getPrototypeOf(thing);
  return (
    proto === Object.prototype ||
    proto === null ||
    Object.getOwnPropertyNames(proto).sort().join("\0") === objectProtoNames
  );
}
