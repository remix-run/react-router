import type {
  DataStrategyFunctionArgs,
  HandlerResult,
} from "@remix-run/router";
import { invariant } from "./utils";

export default async function urlDataStrategy({
  matches,
}: DataStrategyFunctionArgs): Promise<HandlerResult[]> {
  return Promise.all(
    matches.map((match) =>
      match.bikeshed_loadRoute(async (handler) => {
        let response = await handler();
        invariant(response instanceof Response, "Expected a response");
        let contentType = response.headers.get("Content-Type");
        invariant(
          contentType === "application/x-www-form-urlencoded",
          "Invalid Response"
        );
        return new URLSearchParams(await response.text());
      })
    )
  );
}
