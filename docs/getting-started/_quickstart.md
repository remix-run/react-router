---
title: Quick Start 2
order: 1
hidden: true
---

# Quick Start

This document will familiarize you with the day-to-day APIs you'll work with in React Router.

## Hello World!

It's expected you'll have a bundler figured out already for your project, [use this stackblitz][stackblitzstarter] as a starting point if you don't.

This tutorial is for web projects, so we'll be using React Router DOM.

```sh
npm install react-router-dom
```

You'll want your entry script to look like this:

```tsx
import { createRoot } from "react-dom/client";
import { DataBrowserRouter, Route } from "react-router-dom";

// your HTML will need to render a <div id="root"/> to render the app into
const el = document.getElementById("root");

// create the React root and render a DataBrowserRouter
createRoot(el).render(
  <DataBrowserRouter>
    <Route path="/" element={<div>Hello world!</div>} />
  </DataBrowserRouter>
);
```

🎉 Congratulations! Go take a minute to add React Router to your resume.

## Adding Routes

- Adding Routes
- Nested Routes and Outlet
- Params
- Index Routes
- Data Reads
- Global Pending UI
- Active/Pending Link styles
- Handling expected errors (404)
- Handling unexpected errors
- Data Writes as Navigation
- Data Writes w/o Navigation
- Optimistic UI
- Form navigation and URLSearchParams

[stackblitzstarter]: https://stackblitz.com/edit/github-agqlf5?file=src/App.jsx
