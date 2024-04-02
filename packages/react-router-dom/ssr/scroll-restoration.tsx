import * as React from "react";
import type { ScrollRestorationProps as ScrollRestorationPropsRR } from "react-router-dom";
import {
  useLocation,
  useMatches,
  UNSAFE_useScrollRestoration as useScrollRestoration,
} from "react-router-dom";

import type { ScriptProps } from "./components";
import { useRemixContext } from "./components";

let STORAGE_KEY = "positions";

/**
 * This component will emulate the browser's scroll restoration on location
 * changes.
 *
 * @see https://remix.run/components/scroll-restoration
 */
export function ScrollRestoration({
  getKey,
  ...props
}: ScriptProps & {
  getKey?: ScrollRestorationPropsRR["getKey"];
}) {
  let { isSpaMode } = useRemixContext();
  let location = useLocation();
  let matches = useMatches();

  useScrollRestoration({
    getKey,
    storageKey: STORAGE_KEY,
  });

  // In order to support `getKey`, we need to compute a "key" here so we can
  // hydrate that up so that SSR scroll restoration isn't waiting on React to
  // hydrate. *However*, our key on the server is not the same as our key on
  // the client!  So if the user's getKey implementation returns the SSR
  // location key, then let's ignore it and let our inline <script> below pick
  // up the client side history state key
  let key = React.useMemo(
    () => {
      if (!getKey) return null;
      let userKey = getKey(location, matches);
      return userKey !== location.key ? userKey : null;
    },
    // Nah, we only need this the first time for the SSR render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // In SPA Mode, there's nothing to restore on initial render since we didn't
  // render anything on the server
  if (isSpaMode) {
    return null;
  }

  let restoreScroll = ((STORAGE_KEY: string, restoreKey: string) => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key }, "");
    }
    try {
      let positions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
      let storedY = positions[restoreKey || window.history.state.key];
      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error: unknown) {
      console.error(error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }).toString();

  return (
    <script
      {...props}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(${restoreScroll})(${JSON.stringify(
          STORAGE_KEY
        )}, ${JSON.stringify(key)})`,
      }}
    />
  );
}
