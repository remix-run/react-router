import * as React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { routes } from "./App";

let router = createBrowserRouter(routes);

// If you're using lazy route modules and you haven't yet preloaded them onto
// routes, then you'll need to wait for the router to be initialized before
// hydrating, since it will have initial data to hydrate but it won't yet have
// any router elements to render.
//
// This shouldn't be needed in most SSR stacks as you should know what routes
// are initially rendered and be able to SSR the appropriate <Script> tags for
// those modules such that they're readily available on your client-side route
// definitions
if (!router.state.initialized) {
  let unsub = router.subscribe((state) => {
    if (state.initialized) {
      unsub();
      hydrate();
    }
  });
} else {
  hydrate();
}

function hydrate() {
  ReactDOM.hydrateRoot(
    document.getElementById("app"),
    <React.StrictMode>
      <RouterProvider router={router} fallbackElement={null} />
    </React.StrictMode>
  );
}
