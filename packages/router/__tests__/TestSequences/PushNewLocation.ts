import type { History } from "../../history";

export default function PushNewLocation(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.push("/home?the=query#the-hash");
  expect(history.action).toBe("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/home",
    search: "?the=query",
    hash: "#the-hash",
    state: null,
    key: expect.any(String),
  });
}
