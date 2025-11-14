import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

let searchParams = new URLSearchParams(window.location.search);
let transitions = searchParams.has("transitions")
  ? searchParams.get("transitions") === "true"
  : undefined;

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter unstable_useTransitions={transitions} />
    </StrictMode>,
  );
});
