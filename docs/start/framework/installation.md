---
title: Installation
order: 1
---

# Installation

Most projects start with a template. Let's use a basic template maintained by React Router:

```shellscript nonumber
npx create-react-router@latest my-react-router-app
```

You can also create a project using one of the many available deployment templates, which will configure your project for the hosting provider.

```shellscript nonumber
npx create-react-router@latest my-node-custom-server-react-router-app --template remix-run/react-router-templates/node-custom-server

npx create-react-router@latest my-cloudflare-react-router-app --template remix-run/react-router-templates/cloudflare

npx create-react-router@latest my-vercel-react-router-app --template remix-run/react-router-templates/vercel

npx create-react-router@latest my-netlify-react-router-app --template remix-run/react-router-templates/netlify
```

Now change into the new directory and start the app

```shellscript nonumber
cd my-react-router-app
npm i
npm run dev
```

You can now open your browser to `http://localhost:5173`

You can [view the template on GitHub][default-template] to see how to manually set up your project.

To get started with a template that deploys to your preferred host, check out [all of our templates](https://github.com/remix-run/react-router-templates).

---

Next: [Routing](./routing)

[manual_usage]: ../how-to/manual-usage
[default-template]: https://github.com/remix-run/react-router-templates/tree/main/default
