import type { History } from "../../history";

export default function ReplaceState(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.replace("/home?the=query#the-hash", { the: "state" });
  expect(history.action).toBe("REPLACE");
  expect(history.location).toMatchObject({
    pathname: "/home",
    search: "?the=query",
    hash: "#the-hash",
    state: { the: "state" },
  });
}
