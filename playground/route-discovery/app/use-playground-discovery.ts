import { useState } from "react";
import { unstable_useRouteDiscovery } from "react-router";

export function usePlaygroundDiscovery() {
  let [behavior, setBehavior] = useState("cancel");
  let [events, setEvents] = useState<string[]>([]);
  function log(message: string) {
    console.log(message);
    setEvents((previous) => [...previous.slice(-19), message]);
  }

  let discovery = unstable_useRouteDiscovery({
    async onManifestMismatch(event) {
      log(`Mismatch: ${JSON.stringify(event)} → ${behavior}`);
      if (behavior === "load-all") {
        try {
          await event.loadAllRoutes();
          log("Full manifest loaded; pending work can continue");
        } catch (error) {
          log(`Full manifest failed: ${String(error)}`);
        }
      } else if (behavior === "default") {
        await event.defaultBehavior();
      }
      // Returning with an incomplete manifest cancels the pending operation.
    },
  });

  return { ...discovery, behavior, setBehavior, events, log };
}
