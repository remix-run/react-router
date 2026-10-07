---
title: Installation
order: 1
---

# Installation

[MODES: framework]

## Introduction

Most projects start with a template. Let's use a basic template maintained by React Router:

```shellscript nonumber
npx create-react-router@latest my-react-router-app
```

Now change into the new directory and start the app

```shellscript nonumber
cd my-react-router-app
npm i
npm run dev
```

You can now open your browser to `http://localhost:5173`

You can [view the template on GitHub][default-template] to see how to manually set up your project.

We also have a number of [ready to deploy templates][react-router-templates] available for you to get started with:

```shellscript nonumber
npx create-react-router@latest --template remix-run/react-router-templates/<template-name>
```

## Build Tools

React Router's official Framework Mode integration uses Vite through the `@react-router/dev` package. If your project uses Rsbuild, the Rsbuild team maintains [`rsbuild-plugin-react-router`][rsbuild-plugin-react-router], which supports the standard React Router Framework Mode conventions.

Follow the plugin's [installation and usage guide][rsbuild-plugin-react-router-usage] to configure Framework Mode with Rsbuild.

---

Next: [Routing](./routing)

[default-template]: https://github.com/remix-run/react-router-templates/tree/main/default
[react-router-templates]: https://github.com/remix-run/react-router-templates
[rsbuild-plugin-react-router]: https://github.com/rstackjs/rsbuild-plugin-react-router
[rsbuild-plugin-react-router-usage]: https://github.com/rstackjs/rsbuild-plugin-react-router#installation
