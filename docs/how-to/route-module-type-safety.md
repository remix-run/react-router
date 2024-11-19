---
title: Route Module Type Safety
---

# Route Module Type Safety

React Router generates route-specific types to power type inference for URL params, loader data, and more.
This guide will help you set it up if you didn't start with a template.

To learn more about how type safety works in React Router, check out [Type Safety Explanation](../explanation/type-safety).

## 1. Add `.react-router/` to `.gitignore`

React Router generates types into a `.react-router/` directory at the root of your app. This directory is fully managed by React Router and should be gitignore'd.

```txt
.react-router/
```

## 2. Include the generated types in tsconfig

Edit your tsconfig to get TypeScript to use the generated types. Additionally, `rootDirs` needs to be configured so the types can be imported as relative siblings to route modules.

```json filename=tsconfig.json
{
  "include": [".react-router/types/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"]
  }
}
```

## 3. Generate types before type checking

If you want to run type checking as its own command — for example, as part of your Continuous Integration pipeline — you'll need to make sure to generate types _before_ running typechecking:

```json
{
  "scripts": {
    "typecheck": "react-router typegen && tsc"
  }
}
```

## 4. Type-only auto-imports (optional)

When auto-importing the `Route` type helper, TypeScript will generate:

```ts filename=app/routes/my-route.tsx
import { Route } from "./+types/my-route";
```

This will work, but you may want the `type` modifier for the import added automatically as well.

```ts filename=app/routes/my-route.tsx
import type { Route } from "./+types/my-route";
//     ^^^^
```

For example, this helps tools like bundlers to detect type-only module that can be safely excluded from the bundle.

### VSCode

In VSCode, you can get this behavior automatically by selecting `TypeScript › Preferences: Prefer Type Only Auto Imports` from the command palette or by manually setting `preferTypeOnlyAutoImports`:

```json filename=.vscode/settings.json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true
}
```

### eslint

In eslint, you can get this behavior by setting `prefer: "type-imports"` for the `consistent-type-imports` rule:

```json
{
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    { "prefer": "type-imports" }
  ]
}
```

## Conclusion

React Router's Vite plugin should be automatically generating types into `.react-router/types/` anytime you edit your route config (`routes.ts`).
That means all you need to do is run `react-router dev` (or your custom dev server) to get to up-to-date types in your routes.

Check out our [Type Safety Explanation](../explanation/type-safety) for an example of how to pull in those types into your routes.
