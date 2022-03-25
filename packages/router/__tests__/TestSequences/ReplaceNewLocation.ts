import type { History } from "../../history";

export default function ReplaceNewLocation(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.replace("/home?the=query#the-hash");
  expect(history.action).toBe("REPLACE");
  expect(history.location).toMatchObject({
    pathname: "/home",
    search: "?the=query",
    hash: "#the-hash",
    state: null,
    key: expect.any(String),
  });

  history.replace("/");
  expect(history.action).toBe("REPLACE");
  expect(history.location).toMatchObject({
    pathname: "/",
    search: "",
    state: null,
    key: expect.any(String),
  });
}
