import type { History } from "../../index";

export default function PushSamePath(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.push("/home");
  expect(history.action).toBe("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });

  history.push("/home");
  expect(history.action).toBe("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });

  history.go(-1);
  expect(history.action).toBe("POP");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });
}
