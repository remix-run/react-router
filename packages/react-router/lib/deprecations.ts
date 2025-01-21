import type { FutureConfig as RouterFutureConfig } from "@remix-run/router";
import type { FutureConfig as RenderFutureConfig } from "./components";

const alreadyWarned: { [key: string]: boolean } = {};

export function warnOnce(key: string, message: string): void {
  if (__DEV__ && !alreadyWarned[message]) {
    alreadyWarned[message] = true;
    console.warn(message);
  }
}

const logDeprecation = (flag: string, msg: string, link: string) =>
  warnOnce(
    flag,
    `⚠️ React Router Future Flag Warning: ${msg}. ` +
      `You can use the \`${flag}\` future flag to opt-in early. ` +
      `For more information, see ${link}.`
  );

export function logV6DeprecationWarnings(
  renderFuture: Partial<RenderFutureConfig> | undefined,
  routerFuture?: Omit<RouterFutureConfig, "v7_prependBasename">
) {
  if (renderFuture?.v7_startTransition === undefined) {
    logDeprecation(
      "v7_startTransition",
      "React Router will begin wrapping state updates in `React.startTransition` in v7",
      "https://reactrouter.com/v6/upgrading/future#v7_starttransition"
    );
  }

  if (
    renderFuture?.v7_relativeSplatPath === undefined &&
    (!routerFuture || !routerFuture.v7_relativeSplatPath)
  ) {
    logDeprecation(
      "v7_relativeSplatPath",
      "Relative route resolution within Splat routes is changing in v7",
      "https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath"
    );
  }

  if (routerFuture) {
    if (routerFuture.v7_fetcherPersist === undefined) {
      logDeprecation(
        "v7_fetcherPersist",
        "The persistence behavior of fetchers is changing in v7",
        "https://reactrouter.com/v6/upgrading/future#v7_fetcherpersist"
      );
    }

    if (routerFuture.v7_normalizeFormMethod === undefined) {
      logDeprecation(
        "v7_normalizeFormMethod",
        "Casing of `formMethod` fields is being normalized to uppercase in v7",
        "https://reactrouter.com/v6/upgrading/future#v7_normalizeformmethod"
      );
    }

    if (routerFuture.v7_partialHydration === undefined) {
      logDeprecation(
        "v7_partialHydration",
        "`RouterProvider` hydration behavior is changing in v7",
        "https://reactrouter.com/v6/upgrading/future#v7_partialhydration"
      );
    }

    if (routerFuture.v7_skipActionErrorRevalidation === undefined) {
      logDeprecation(
        "v7_skipActionErrorRevalidation",
        "The revalidation behavior after 4xx/5xx `action` responses is changing in v7",
        "https://reactrouter.com/v6/upgrading/future#v7_skipactionerrorrevalidation"
      );
    }
  }
}
