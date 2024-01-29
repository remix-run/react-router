import type { DataStrategyFunctionArgs, DataResult } from "@remix-run/router";
import { ResultType } from "@remix-run/router";
import { invariant } from "./utils";

export default async function urlDataStrategy({
  matches,
  request,
  type,
}: DataStrategyFunctionArgs): Promise<DataResult[]> {
  return Promise.all(
    matches.map(async (match) => {
      try {
        let handler =
          type === "loader" ? match.route.loader : match.route.action;
        let response = await handler!({ params: match.params, request });
        invariant(response instanceof Response, "Expected a response");
        let contentType = response.headers.get("Content-Type");
        invariant(
          contentType === "application/x-www-form-urlencoded",
          "Invalid Response"
        );
        return {
          type: ResultType.data,
          data: new URLSearchParams(await response.text()),
        };
      } catch (error) {
        return {
          type: ResultType.error,
          error,
        };
      }
    })
  );
}
