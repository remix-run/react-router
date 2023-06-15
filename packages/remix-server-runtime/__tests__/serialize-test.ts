import type { SerializeFrom } from "../index";
import { defer, json } from "../index";
import type { IsNever } from "./utils";
import { isEqual } from "./utils";

describe("SerializeFrom", () => {
  it("infers types", () => {
    isEqual<SerializeFrom<string>, string>(true);
    isEqual<SerializeFrom<number>, number>(true);
    isEqual<SerializeFrom<boolean>, boolean>(true);
    isEqual<SerializeFrom<String>, String>(true);
    isEqual<SerializeFrom<Number>, Number>(true);
    isEqual<SerializeFrom<Boolean>, Boolean>(true);
    isEqual<SerializeFrom<null>, null>(true);

    isEqual<IsNever<SerializeFrom<undefined>>, true>(true);
    isEqual<IsNever<SerializeFrom<Function>>, true>(true);
    isEqual<IsNever<SerializeFrom<symbol>>, true>(true);

    isEqual<SerializeFrom<[]>, []>(true);
    isEqual<SerializeFrom<[string, number]>, [string, number]>(true);
    isEqual<SerializeFrom<[number, number]>, [number, number]>(true);

    isEqual<SerializeFrom<ReadonlyArray<string>>, string[]>(true);
    isEqual<SerializeFrom<ReadonlyArray<Function>>, null[]>(true);

    isEqual<SerializeFrom<{ hello: "remix" }>, { hello: "remix" }>(true);
    isEqual<
      SerializeFrom<{ data: { hello: "remix" } }>,
      { data: { hello: "remix" } }
    >(true);
  });

  it("infers type from json responses", () => {
    let loader = () => json({ hello: "remix" });
    isEqual<SerializeFrom<typeof loader>, { hello: string }>(true);

    let asyncLoader = async () => json({ hello: "remix" });
    isEqual<SerializeFrom<typeof asyncLoader>, { hello: string }>(true);
  });

  it("infers type from defer responses", () => {
    let loader = async () => defer({ data: { hello: "remix" } });
    isEqual<SerializeFrom<typeof loader>, { data: { hello: string } }>(true);
  });

  // Special case that covers https://github.com/remix-run/remix/issues/5211
  it("infers type from json responses containing a data key", () => {
    let loader = async () => json({ data: { hello: "remix" } });
    isEqual<SerializeFrom<typeof loader>, { data: { hello: string } }>(true);
  });
});
