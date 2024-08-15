import type { FutureConfig as RouterFutureConfig } from "@remix-run/router";
import type { FutureConfig as RenderFutureConfig } from "./components";

const alreadyWarned: { [key: string]: boolean } = {};

export function warnOnce(key: string, message: string): void {
  if (!alreadyWarned[message]) {
    alreadyWarned[message] = true;
    console.warn(message);
  }
}

const logDeprecation = (flag: string, msg: string, link: string) =>
  warnOnce(
    flag,
    `⚠️ Future Flag Warning: ${msg}. ` +
      `You can use the \`${flag}\` future flag to opt-in early. ` +
      `For more information, see ${link}.`
  );

export function logV6DeprecationWarnings(
  future:
    | Partial<
        Omit<RouterFutureConfig, "v7_prependBasename"> & RenderFutureConfig
      >
    | undefined,
  isDataRouter: boolean
) {
  if (!future?.v7_relativeSplatPath) {
    logDeprecation(
      "v7_relativeSplatPath",
      "Relative route resolution within Splat routes is changing in v7",
      "https://reactrouter.com/en/v7/upgrading/future#v7_relativesplatpath"
    );
  }

  if (!future?.v7_startTransition) {
    logDeprecation(
      "v7_startTransition",
      "React Router will begin wrapping state updates in `React.startTransition` in v7",
      "https://reactrouter.com/en/v7/upgrading/future#v7_starttransition"
    );
  }

  if (isDataRouter) {
    if (!future?.v7_fetcherPersist) {
      logDeprecation(
        "v7_fetcherPersist",
        "The persistence behavior of fetchers is changing in v7",
        "https://reactrouter.com/en/v7/upgrading/future#v7_fetcherpersist"
      );
    }

    if (!future?.v7_normalizeFormMethod) {
      logDeprecation(
        "v7_normalizeFormMethod",
        "Casing of `formMethod` fields is being normalized to uppercase in v7",
        "https://reactrouter.com/en/v7/upgrading/future#v7_normalizeformmethod"
      );
    }

    if (!future?.v7_partialHydration) {
      logDeprecation(
        "v7_partialHydration",
        "`RouterProvider` hydration behavior is changing in v7",
        "https://reactrouter.com/en/v7/upgrading/future#v7_partialhydration"
      );
    }

    if (!future?.v7_skipActionErrorRevalidation) {
      logDeprecation(
        "v7_skipActionErrorRevalidation",
        "The revalidation behavior after 4xx/5xx `action` responses is changing in v7",
        "https://reactrouter.com/en/v7/upgrading/future#v7_skipactionerrorrevalidation"
      );
    }
  }
}
