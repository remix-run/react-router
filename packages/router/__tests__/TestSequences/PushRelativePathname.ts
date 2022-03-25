import type { History } from "../../history";

export default function PushRelativePathname(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.push("/the/path?the=query#the-hash");
  expect(history.action).toBe("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/the/path",
    search: "?the=query",
    hash: "#the-hash",
  });

  history.push("../other/path?another=query#another-hash");
  expect(history.action).toBe("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/other/path",
    search: "?another=query",
    hash: "#another-hash",
  });
}
