import type { History } from "../../history";

export default function ReplaceSamePath(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.replace("/home");
  expect(history.action).toBe("REPLACE");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });

  let prevLocation = history.location;

  history.replace("/home");
  expect(history.action).toBe("REPLACE");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });

  expect(history.location).not.toBe(prevLocation);
}
