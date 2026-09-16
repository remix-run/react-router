---
title: Deploying
order: 10
---

# Deploying

[MODES: framework]

## Introduction

React Router can be deployed two ways:

- Fullstack Hosting
- Static Hosting

The official [React Router templates](https://github.com/remix-run/react-router-templates) can help you bootstrap an application or be used as a reference for your own application.

When deploying to static hosting, you can deploy React Router the same as any other single page application with React.

## Templates

After running the `create-react-router` command, make sure to follow the instructions in the README.

### Node.js with Docker

```
npx create-react-router@latest --template remix-run/react-router-templates/default
```

- Server Rendering
- Tailwind CSS

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### Node with Docker (Custom Server)

```
npx create-react-router@latest --template remix-run/react-router-templates/node-custom-server
```

- Server Rendering
- Tailwind CSS
- Custom express server for more control

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### Node with Docker and Postgres

```
npx create-react-router@latest --template remix-run/react-router-templates/node-postgres
```

- Server Rendering
- Postgres Database with Drizzle
- Tailwind CSS
- Custom express server for more control

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### Vercel

Vercel maintains their own template for React Router. Checkout the [Vercel Guide](https://vercel.com/templates/react-router/react-router-boilerplate) for more information.

### Cloudflare Workers

Cloudflare maintains their own template for React Router. Checkout the [Cloudflare Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/) for more information.

### Netlify

Netlify maintains their own template for React Router. Checkout the [Netlify Guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/react-router/) for more information.

### EdgeOne Pages

EdgeOne Pages maintains their own template for React Router. Checkout the [EdgeOne Pages Guide](https://pages.edgeone.ai/document/framework-react-router) for more information.

### DeployHQ

DeployHQ maintains their own guide for deploying React Router to your own server. Checkout the [DeployHQ Guide](https://www.deployhq.com/guides/deploy-react-router-from-github) for more information.

### Hostinger

Hostinger supports deploying React Router applications with server rendering on its managed Node.js hosting, including automatic deployments from GitHub. Checkout the [Hostinger Guide](https://www.hostinger.com/web-apps-hosting/react-router-hosting) for more information.

## Version Skew

When you deploy a new build, tabs that were opened beforehand keep running the
previous build's client modules. If those tabs navigate, they fetch `.data` from
the new server, and a loader payload that changed shape between the two builds
can break the stale client.

React Router compares build versions when it fetches the manifest, but a
navigation to a route the tab already discovered makes no manifest request, so
that comparison never runs.

If your deployment replaces old servers rather than keeping them addressable,
opt into comparing the build version on every data request:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_detectVersionSkew: true,
  },
} satisfies Config;
```

The server then stamps its build version onto every single-fetch response, and a
client on a different build performs a document navigation instead of rendering
the new data. That navigation discards in-flight form state, so leave this off
if your app would rather tolerate skew.

Do not cache `.data` responses across deploys while this is enabled: a cached
response from an older build keeps mismatching after the reload, which surfaces
as an error rather than recovering.

Platforms that keep previous builds addressable (serving each deploy's assets
from its own URL) can handle skew at the platform level instead. RSC Framework
Mode already compares versions on every data fetch, so the flag is a no-op
there.

See [`future.unstable_detectVersionSkew`](../../upgrading/future#futureunstable_detectversionskew)
for the full caveats.
