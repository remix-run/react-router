import type { History } from "../../history";

export default function PushRelativePathnameWarning(history: History) {
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

  let spy = jest.spyOn(console, "warn").mockImplementation(() => {});
  history.push("../other/path?another=query#another-hash");
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("relative pathnames are not supported")
  );
  spy.mockReset();

  expect(history.location).toMatchObject({
    pathname: "../other/path",
    search: "?another=query",
    hash: "#another-hash",
  });
}
