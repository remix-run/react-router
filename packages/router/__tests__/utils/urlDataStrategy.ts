import type {
  DataStrategyFunctionArgs,
  HandlerResult,
} from "@remix-run/router";
import { ResultType } from "@remix-run/router";
import { invariant } from "./utils";

export default async function urlDataStrategy({
  matches,
}: DataStrategyFunctionArgs): Promise<HandlerResult[]> {
  return Promise.all(
    matches.map(async (match) => {
      try {
        let { result: response } = await match.handler();
        invariant(response instanceof Response, "Expected a response");
        let contentType = response.headers.get("Content-Type");
        invariant(
          contentType === "application/x-www-form-urlencoded",
          "Invalid Response"
        );
        return {
          type: ResultType.data,
          result: new URLSearchParams(await response.text()),
        };
      } catch (error) {
        return {
          type: ResultType.error,
          result: error,
        };
      }
    })
  );
}
