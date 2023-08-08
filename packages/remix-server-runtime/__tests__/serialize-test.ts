import type { SerializeFrom } from "../index";
import { defer, json } from "../index";
import { isEqual } from "./utils";

it("infers basic types", () => {
  isEqual<
    SerializeFrom<{
      hello?: string;
      count: number | undefined;
      date: Date | number;
      isActive: boolean;
      items: { name: string; price: number; orderedAt: Date }[];
    }>,
    {
      hello?: string;
      count?: number;
      date: string | number;
      isActive: boolean;
      items: { name: string; price: number; orderedAt: string }[];
    }
  >(true);
});

it("infers deferred types", () => {
  let get = (): Promise<Date> | undefined => {
    if (Math.random() > 0.5) return Promise.resolve(new Date());
    return undefined;
  };
  let loader = async () =>
    defer({
      critical: await Promise.resolve("hello"),
      deferred: get(),
    });
  isEqual<
    SerializeFrom<typeof loader>,
    {
      critical: string;
      deferred: Promise<string> | undefined;
    }
  >(true);
});

it("infers types from json", () => {
  let loader = () => json({ data: "remix" });
  isEqual<SerializeFrom<typeof loader>, { data: string }>(true);

  let asyncLoader = async () => json({ data: "remix" });
  isEqual<SerializeFrom<typeof asyncLoader>, { data: string }>(true);
});

it("infers type from defer", () => {
  let loader = async () => defer({ data: "remix" });
  isEqual<SerializeFrom<typeof loader>, { data: string }>(true);
});
