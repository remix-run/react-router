import type { History } from "../../index";

export default function GoForward(history: History, spy: jest.SpyInstance) {
  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.push("/home");
  expect(history.action).toEqual("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });
  expect(spy).not.toHaveBeenCalled();

  history.go(-1);
  expect(history.action).toEqual("POP");
  expect(history.location).toMatchObject({
    pathname: "/",
  });
  expect(spy).toHaveBeenCalledWith({
    action: "POP",
    location: {
      hash: "",
      key: expect.any(String),
      pathname: "/",
      search: "",
      state: null,
    },
  });
  expect(spy.mock.calls.length).toBe(1);

  history.go(1);
  expect(history.action).toEqual("POP");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });
  expect(spy).toHaveBeenCalledWith({
    action: "POP",
    location: {
      hash: "",
      key: expect.any(String),
      pathname: "/home",
      search: "",
      state: null,
    },
  });
  expect(spy.mock.calls.length).toBe(2);
}
