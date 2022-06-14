import { installGlobals } from "@remix-run/node";
import { createMemoryRouter } from "@remix-run/router";
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { DataStaticRouter } from "react-router-dom/server";
import { routes } from "./App";

// Polyfill Web Fetch API
installGlobals();

export async function render(url: string) {
  let router = createMemoryRouter({
    routes,
    initialEntries: [url],
    isSSR: true,
  });

  try {
    await router.navigate(url, { replace: true });

    return {
      hydrationData: {
        loaderData: router.state.loaderData,
        actionData: router.state.actionData,
        errors: router.state.errors,
      },
      html: ReactDOMServer.renderToString(
        <React.StrictMode>
          <DataStaticRouter router={router} />
        </React.StrictMode>
      ),
    };
  } finally {
    router.dispose();
  }
}
