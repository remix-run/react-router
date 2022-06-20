import { createStaticRouter } from "@remix-run/router";
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { DataStaticRouter } from "react-router-dom/server";
import { routes } from "./App";

export async function render(url: string) {
  let router = createStaticRouter({ routes });

  try {
    await router.load(url);

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

    return { hydrationData, html };
  } finally {
    router.dispose();
  }
}
