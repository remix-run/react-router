# Do not rely on treeshaking for correctness

Date: 2024-01-02

Status: accepted

## Context

Remix lets you write code that runs on both the server and the client.
For example, it's common to have server and client code in the same route file.
While blending server and client code is convenient, Remix needs to ensure that server-only code is never shipped to the client.
This prevents secrets available to the server from leaking into client and also prevents the client from crashing due to code that expects a server environment.

Server-only code comes in three forms:

1. Server-only route exports like `loader`, `action`, `headers`, etc.
2. Imports from `.server` directories or `.server` files.
3. Imports from server-only packages like `node:fs`

Remix previously relied on treeshaking to exclude server-only code.
Specifically, Remix used [virtual modules for each route][virtual-modules] that re-exported client-safe exports from the route.
For a brief stint, Remix instead used [AST transforms][ast-transforms] to remove server-only exports.
In either case, Remix would remove server exports from routes and then let the bundler treeshake any unused code and dependencies from the client bundle.

The main benefit is that server and client code can co-exist in the same module graph and even the same file
and the treeshaking saves you from the tedium of explicitly marking or separating server-only code yourself.

### Human error

However, this is also the main drawback; "server-only" is implicit and must be inferred by thorough treeshaking.
Even if treeshaking were perfect, this approach still leaves the door open to human error.
If you or anyone on your team accidentally references server-only code from client code, the bundler will happily include that code in the client.
You won't get any indication of this at build time, but only at runtime.
Your app could crash when trying to execute code meant for the server, or worse, you could accidentally ship secrets to the client.

### `.server` modules

Instead of hoping such an accident never happens, Remix provides a mechanism for ensuring that server-only code is excluded from the client bundle; `.server` modules.
Any modules with a directory named `.server` are never allowed into the module graph for the client.
Similarly, files with a `.server` extension are also excluded from the client module graph.

Theoretically, `.server` modules are a redundancy.
A perfect module graph with perfect treeshaking shouldn't _need_ `.server` modules.
But in practice, `.server` modules are indispensable.
They are the only guaranteed way to exclude code from the client.

### An imperfect optimization

As we already discussed, even if treeshaking were perfect, it would still be a bad idea to rely on it to exclude server-only code.
But treeshaking is a hard problem, especially in a language as dynamic as JavaScript.
In the real world, treeshaking is not perfect.

That's why treeshaking is designed to be an _optimization_ that slims down your bundle.
Your code should already be correct before treeshaking is applied.
Bundlers are allowed to make [their own tradeoffs about how much treeshaking][esbuild-minify-considerations] they want to do.
And that shouldn't [affect Remix's implementation][remix-minify-syntax].
They are even allowed to do _less_ treeshaking without needing a major version bump.

Additionally, code can only be treeshaken if it is known to be side-effect free.
Unfortunately, even fully side-effect free packages often omit `sideEffects: false` from their `package.json`.
And sometimes side-effects are desired!
What if there's a server-side package with side-effects that we want to include in our server bundle?
How could we exclude that from the client bundle?
There are ways, but they're all hacky and brittle.

### Vite

Remix is becoming a Vite plugin, but Vite's on-demand compilation in dev is incompatible with treeshaking.
Since the compilation is on-demand, Vite only knows the _current_ importer for the module, not all possible importers.

### Summary

- Even if treeshaking were perfect, it leaves the door open for human error
- `.server` modules guarantee that server-only code is excluded from the client
- Treeshaking is an imperfect _optimization_, so a Remix app should work correctly and exclude server-only code even without treeshaking
- Vite's architecture makes treeshaking in dev untenable

## Decision

Do not rely on implicit, cross-module treeshaking for correctness.
Instead:

- Forcibly remove server-only route exports and then explicitly run a dead-code elimination pass
- Explicitly mark server-only code and throw a build time error if server code is still referenced in the client

## Consequences

- No reliance on optimizations for correctness
- Build-time errors instead of runtime errors
- Errors consistent across dev and prod with Vite
- Exports are assumed to be client-safe unless explicitly marked as server-only
  - For example, `.server` modules mark all their exports as server-only
  - Route exports like `loader`, `action`, `headers`, etc. are an exception as they are already known to be server-only

[virtual-modules]: https://github.com/remix-run/remix/blob/71f0e051d895807c349987655325c153903abad8/packages/remix-dev/compiler/js/plugins/routes.ts
[ast-transforms]: https://github.com/remix-run/remix/pull/5259
[esbuild-minify-considerations]: https://esbuild.github.io/api/#minify-considerations
[remix-minify-syntax]: https://github.com/remix-run/remix/blob/bf042e7d340b3cbfdaa389c201e1284fb4d03403/packages/remix-dev/compiler/server/compiler.ts#L80-L88
