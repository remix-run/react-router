import { installGlobals } from "@remix-run/node";
import type { Router as DataRouter } from "@remix-run/router";
import { createMemoryRouter } from "@remix-run/router";
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { DataStaticRouter } from "react-router-dom/server";
import { routes } from "./App";

// Polyfill Web Fetch API
installGlobals();

export async function render(url: string) {
  let router: DataRouter = await new Promise((resolve, reject) => {
    try {
      // Create a single-use server router and perform the singular navigation
      createMemoryRouter({
        routes,
        initialEntries: [url],
        ssrCallback(_router, redirect) {
          if (redirect) {
            reject(redirect);
          } else {
            resolve(_router);
          }
        },
      }).navigate(url, { replace: true });
    } catch (e) {
      reject(e);
    }
  });

  let hydrationData = {
    loaderData: router.state.loaderData,
    actionData: router.state.actionData,
    errors: router.state.errors,
  };

  let html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <DataStaticRouter router={router} />
    </React.StrictMode>
  );

  router.dispose();
  router = null;

  return {
    hydrationData,
    html,
  };
}
