---
title: Installation
order: 1
---

# Installation

<docs-info>

React Router v7 requires the following minimum versions:

- `node@20`
- `react@18`
- `react-dom@18`

</docs-info>

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

---

Next: [Routing](./routing)

[manual_usage]: ../how-to/manual-usage
[default-template]: https://github.com/remix-run/react-router-templates/tree/main/default
[react-router-templates]: https://github.com/remix-run/react-router-templates
