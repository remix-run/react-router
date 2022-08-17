---
title: Feature Overview
order: 1
---

# Feature Overview

## Client Side Routing

React Router enables "client side routing".

In traditional websites, the browser requests a document from a web server, downloads and evaluates CSS and JavaScript assets, and renders the HTML sent from the server. When the user clicks a link, it starts the process all over again for a new page.

Client side routing allows your app to update the URL from a link click without making another request for another document from the server. Instead, your app can immediately render some new UI and make data requests with `fetch` to update the page with new information.

This enables faster user experiences because the browser doesn't need to request an entirely new document or re-evaluate CSS and JavaScript assets for the next page. It also enables more dynamic user experiences with things like animation.

Client side routing is enabled by rendering a `Router` and linking to pages with `Link`:

```jsx [10,16]
import React from "react";
import { createRoot } from "react-dom/client";
import {
  DataBrowserRouter,
  Route,
  Link,
} from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <DataBrowserRouter>
    <Route
      path="/"
      element={
        <div>
          <h1>Hello World</h1>
          <Link to="about">About Us</Link>
        </div>
      }
    />
    <Route path="/about" element={<div>About</div>} />
  </DataBrowserRouter>
);
```

## Nested Routes

React Router's nested routes were inspired by the routing system in Ember.js circa 2014. The Ember team realized nearly every time you had nested URLs, you also had nested UI layouts, and each layout had its own data dependencies. React Router embraces that convention, too.

A "nested URL" is a URL with multiple segments (the stuff between the `/`):

```
https://example.com/projects/145242/documents/826247
```

This URL has

- The layouts to render on the page
- The code split JavaScript bundles to load
- The data dependencies of those layouts

## Dynamic Segments

## Active Links

## Relative Links

## Data Loading

## Redirects

## Pending UI

## Deferred Data Loading

## Data Mutations

## Data Revalidation

## Optimistic UI

## Data Fetchers

## Race Condition Handling

## Error Handling

## Scroll Restoration

## Web Standard APIs

## Search Params

## Location State
