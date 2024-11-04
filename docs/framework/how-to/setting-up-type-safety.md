---
title: Setting up type safety
---

To know more about how type safety works in React Router, check out our [dedicated explanation](../../explanation/type-safety).

# Setting up type safety

React Router generates types into a `.react-router/` directory at the root of your app.
This directory is fully managed by React Router and is derived from your route config (`app/routes.ts` by default), so it should be gitignore'd.

👉 **Add `.react-router/` to `.gitignore`**

```txt
.react-router/
```

Make sure generated types are always present before type checking,
especially when running type checking in CI.

👉 **Add `react-router typegen` to your `typecheck` command in `package.json`**

```json
{
  "scripts": {
    "typecheck": "react-router typegen && tsc"
  }
}
```

To get TypeScript to use those generated types, you'll need to add them to `include` in `tsconfig.json`.
And to be able to import them as if they files next to your route modules, you'll also need to [configure `rootDirs`](https://www.typescriptlang.org/tsconfig/#rootDirs).

👉 **Configure `tsconfig.json` for generated types**

```json
{
  "include": [".react-router/types/**/*"],
  "compilerOptions": {
    "rootDirs": [".", "./.react-router/types"]
  }
}
```

During development, its nice to have a dedicate `package.json` script to run type generation in watch mode.

👉 **Add a `typegen --watch` script** (optional)

```json filename=package.json
{
  "scripts": {
    "typegen:watch": "react-router typegen --watch"
  }
}
```

## Automatic typegen in VSCode (optional)

If you'd rather not need to remember to run `react-router typegen --watch` every time you start working on your app, you can use [VSCode Tasks](https://code.visualstudio.com/docs/editor/tasks) to automate this.
Let's make use of the `typegen:watch` script you added earlier.

👉 **Configure a VSCode task for `typegen:watch`**

```json filename=.vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "React Router: Typegen",
      "type": "shell",
      "command": "npm run typegen:watch",
      "problemMatcher": [],
      "isBackground": true,
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "dedicated"
      },
      "runOptions": {
        "runOn": "folderOpen"
      }
    }
  ]
}
```

<docs-info>

You should create `.vscode/tasks.json` in the directory you plan to open with VSCode.
For monorepos, you can create this file in the repo root and use the [`cwd` option for the task](https://code.visualstudio.com/docs/editor/tasks#_custom-tasks) to run the command within a subfolder.

</docs-info>

Now, VSCode will automatically run the `typegen:watch` script in a dedicated terminal anytime you open your project.
