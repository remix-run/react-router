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

```
npx create-react-router@latest --template remix-run/react-router-templates/vercel
```

- Server Rendering
- Tailwind CSS

### Cloudflare Workers w/ D1

```
npx create-react-router@latest --template remix-run/react-router-templates/cloudflare-d1
```

- Server Rendering
- D1 Database with Drizzle ORM
- Tailwind CSS

### Cloudflare Workers

```
npx create-react-router@latest --template remix-run/react-router-templates/cloudflare
```

- Server Rendering
- Tailwind CSS

### Netlify

```
npx create-react-router@latest --template remix-run/react-router-templates/netlify
```

- Server Rendering
- Tailwind CSS
