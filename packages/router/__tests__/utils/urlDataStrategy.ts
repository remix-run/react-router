import type { DataStrategyFunction } from "@remix-run/router";
import { invariant } from "./utils";

const urlDataStrategy: DataStrategyFunction = async ({ matches }) => {
  let results: Record<string, { type: "data" | "error"; result: unknown }> = {};
  await Promise.all(
    matches.map((match) =>
      match.resolve(async (handler) => {
        let response = await handler();
        invariant(response instanceof Response, "Expected a response");
        let contentType = response.headers.get("Content-Type");
        invariant(
          contentType === "application/x-www-form-urlencoded",
          "Invalid Response"
        );
        results[match.route.id] = {
          type: "data",
          result: new URLSearchParams(await response.text()),
        };
      })
    )
  );
  return results;
};

export default urlDataStrategy;
