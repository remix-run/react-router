import type { History } from "../../history";

export default function PushState(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.push("/home?the=query#the-hash", { the: "state" });
  expect(history.action).toBe("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/home",
    search: "?the=query",
    hash: "#the-hash",
    state: { the: "state" },
  });
}
