# Only support JS conversion for app code

Date: 2023-01-20

Status: accepted

## Context

Remix defaults to Typescript, but some users prefer to use Javascript.
When creating a new Remix project via `npx create-remix` today, the CLI asks the user if they'd
prefer to use Typescript or Javascript.

```sh
❯ npx create-remix@latest
? Where would you like to create your app? ./my-remix-app
? What type of app do you want to create? Just the basics
? Where do you want to deploy? Choose Remix App Server if you're unsure; it's easy to change deployment targets. Remix App Server
? TypeScript or JavaScript? (Use arrow keys)
❯ TypeScript
  JavaScript
```

Originally, this was implemented by having separate variants of a template for TS and JS.
This worked, but duplicated huge portions of templates making those variants hard to maintain.
To fix this, the decision was made to maintain _only_ the TS variant of each template.
To provide JS-only Remix projects, the Remix CLI would copy the TS template and then dynamically
convert all Typescript-related code to their Javascript equivalents.

While converting the code in the Remix app directory (e.g. `app/`) is reliable, conversion of
TS-related code outside of the `app/` directory are tricky and error-prone.

### 1 Stale references to `.ts` files

For example, both the [Indie][indie-stack] and [Blues][blues-stack] stacks have broken scripts when selecting `Javascript`,
because they still reference `server.ts` and `seed.ts`.
They also still reference TS-only tools like `ts-node` in their scripts.

### 2.a MJS

When transpiling code outside of the `app/` directory from TS to JS, the easiest thing to do is
to convert to ESM-style `.mjs` since Remix app code already uses ESM.

ESM-style JS requires one of the following:

- a) Set `"type": "module"` in `package.json`
- b) Use `.mjs` extension

(a) immediately breaks Remix's builds since the settings in `package.json` apply to app code, not just code and
scripts outside of the app directory.

(b) seems more promising, but `.mjs` files require file extensions for import specifiers.
Reliably changing relative imports without extensions to have the proper extensions is
untractable since not all imports will be for `.js` files.

```js
// ./script.mjs (converted from ./script.js)
import myHelper from "./my-helper";

// Should this be converted to `./my-helper.mjs`?
// Probably, but can we be sure?

myHelper();
```

Maybe there's a way to do this, but the complexity cost seems high.

### 2.b CJS

If we don't use the `.mjs` extension, Node will default to treating scripts and code outside of the app directory
as CJS.
Since CJS doesn't support ESM-style `import`/`export`, we'd then need to convert all `import`s and `export`s to their
equivalent `require`/`module.exports`.

Important to remember that the converted code is meant to be read and edited by other developers, so its not acceptable
to produce a bunch of boilerplate adapters for the imports and exports as would be typical in build output.

Converting the imports and exports may be doable, but again, carries high complexity cost.

## Decision

Only support JS conversion for app code, not for scripts or code outside of the Remix app directory.

## Consequences

Users will have three options:

1. Use a Typescript template
2. Use a Typescript template with app directory converted to JS
3. Use a dedicated Javascript template

### Converting remaining TS to JS

If you don't like the remaining TS from option (2) and cannot find a suitable template for option (3),
you can still remove any remaining Typescript code manually:

- Remove `tsconfig.json` or replace it with the equivalent `jsconfig.json`
- Replace TS-only tools with their JS counterparts (e.g. `ts-node` -> `node`)
- Change any remaining `.ts` files to `.mjs` and update imports and other references (like `package.json` scripts) to refer to the new filename

[indie-stack]: https://github.com/remix-run/indie-stack
[blues-stack]: https://github.com/remix-run/blues-stack
