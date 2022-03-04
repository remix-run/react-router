import type { History } from "../../index";

export default function GoForward(history: History) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.push("/home");
  expect(history.action).toEqual("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });

  history.go(-1);
  expect(history.action).toEqual("POP");
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.go(1);
  expect(history.action).toEqual("POP");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });
}
