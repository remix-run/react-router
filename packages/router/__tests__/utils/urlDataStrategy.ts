import type {
  DataStrategyFunction,
  DataStrategyFunctionArgs,
} from "@remix-run/router";
import { invariant } from "./utils";

export default async function urlDataStrategy({
  matches,
}: DataStrategyFunctionArgs): ReturnType<DataStrategyFunction> {
  return Promise.all(
    matches.map((match) =>
      match.resolve(async (handler) => {
        let response = await handler();
        invariant(response instanceof Response, "Expected a response");
        let contentType = response.headers.get("Content-Type");
        invariant(
          contentType === "application/x-www-form-urlencoded",
          "Invalid Response"
        );
        return {
          type: "data",
          result: new URLSearchParams(await response.text()),
        };
      })
    )
  );
}
