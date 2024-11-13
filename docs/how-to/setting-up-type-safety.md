---
title: Setting up type safety
---

# Route Module Type Safety

React Router provides type safety and route-specific type inference through a TypeScript plugin. It can infer routes URL params, loader data, and more.

This guide will help you set it up if you didn't start with a template. To learn more about how type safety works in React Router, check out [Type Safety Explanation](../explanation/type-safety).

## 1. Add `.react-router/` to `.gitignore`

React Router generates types into a `.react-router/` directory at the root of your app. This directory is fully managed by React Router and should be gitignore'd.

```txt
.react-router/
```

## 2. Include the types in tsconfig

Edit your tsconfig to get TypeScript to use the generated types. Additionally, `rootDirs` needs to be configured so the types can be imported as as if they were files next to your route module.

```json filename=tsconfig.json
{
  "include": [".react-router/types/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"]
  }
}
```

From there, the types will automatically be generated when running `react-router dev` and `react-router build`.

## 3. Manually generate types

This step is optional.

Types are generated automatically with `react-router dev` and `react-router build` but you'll need to generate the types manually when type checking outside those commands, like in CI.

```json
{
  "scripts": {
    "typecheck": "react-router typegen && tsc"
  }
}
```

You can also watch for changes: `react-router typegen --watch`.
