# Splitting up client and server code in Vite

Date: 2024-02-01

Status: accepted

## Context

Before adopting Vite, Remix used to rely on ESbuild's treeshaking to implicitly separate client and server code.
Even though Vite provides equivalent treeshaking (via Rollup) for builds, it does not perform cross-module treeshaking when running the dev server.
In any case, we think its a [bad idea to rely on treeshaking for correctness][decision-0009].

Goals:

1. Simple and robust exclusion of server-only code from the client
2. Prefer compile-time errors over runtime errors
3. Typesafety for runtime errors
4. Avoid performance degradation for common cases

#### Remix's approach before Vite

Remix already provides `.server` modules to explicitly separate client and server code at the module level (Goal 1 ✅).
However, Remix's previous compiler replaced `.server` modules with empty modules.
While this ensured that code from `.server` modules never leaks into the client,
it also meant that any accidental references to imports from `.server` in the client
would result in runtime errors, not compile-time errors (Goal 2 ❌).

TypeScript does not understand that imports from `.server` modules may not exist on the client
so typechecking does not catch these runtime errors (Goal 3 ❌).

For example:

```tsx
import { getFortune } from "~/db.server.ts";

export default function Route() {
  const [fortune, setFortune] = useState(null);
  return (
    <>
      {user ? (
        <h1>Your fortune of the day: {fortune}</h1>
      ) : (
        <button onClick={() => setFortune(getFortune())}>
          Open fortune cookie 🥠
        </button>
      )}
    </>
  );
}
```

Your editor would not show any red squigglies, typechecking in CI would pass, and Remix would build your app without warnings or errors.
But you've just shipped a bug that will crash your app anytime a user clicks the "Get user" button.

#### How Vite's dev server works

In development, Vite's dev server compiles requested JavaScript modules on the fly.
As a result, Vite must decide how to transform each module without knowing the entire module graph.
The Plugin API makes this apparent:[^1]

- `resolveId` only provides the current `importer`
- `load` and `transform` do not receive any information about the module graph

This approach lets Vite load and transform each module _once_ and cache the result[^2] which is a keystone for its speed.

#### Handling mixed modules

While `.server` modules are a great way to separate client and server code in most cases,
there will always be a need to stitch together modules that mix client and server code.
For example, you may want to migrate from the previous compiler to Vite without needing to manually split up mixed modules.

But supporting mixed modules directly in Remix would require compile-time magic which would add substantial complexity.
Not only would it degrade performance for all users (Goal 4 ❌),
but writing compile-time transforms that manipulate the AST is much more error-prone than throwing a compile-time error when `.server` modules are imported by client code.
Depending on how its implemented, bugs in that compile-time magic could open the door to leaking server code into the client (Goal 1 ❌).

## Decision

- Support `.server` modules (including new `.server` directories) in Remix to split client and server code at the module-level (Goal 1 ✅)
- Recommend [vite-env-only][vite-env-only] for expression-level separation (Goal 1 ✅)
- For each Remix route module, remove server-only exports (`loader`, `action`, `headers`) and then explicitly run dead-code eliminate
- Throw a compile-time error when `.server` modules remained after dead-code elimination (Goal 2 ✅)

## Consequences

Users are encouraged to primarily use `.server` modules but can always opt for more powerful, expression-level separation with [vite-env-only][vite-env-only].

#### Typesafety

Since Remix now throws when `.server` imports remain in the built client code, there are no remaining runtime errors to catch with typechecking for module-level separation (Goal 3 ✅).
For expression-level separation, `vite-env-only` provides optional types (`<T>(_: T) => T | undefined`) which lets TypeScript prevent any runtime errors.

#### Performance

Checking for `.server` modules only requires checking the module's path and does not require AST parsing or transformations, so it's extremely fast (Goal 4 ✅).
`vite-env-only` does require AST parsing and transformations so it will always be slower than `.server` modules.

[^1]: Vite provides a lower-level module graph API, but the module graph is not guaranteed to be complete as it is only populated as modules are requested.
[^2]: When a file changes on disk, Vite invalidates the corresponding module in its cache to power features like HMR.

[decision-0009]: ./0009-do-not-rely-on-treeshaking-for-correctness.md
[vite-env-only]: https://github.com/pcattori/vite-env-only
