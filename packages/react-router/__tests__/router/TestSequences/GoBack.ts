import type { History } from "../../history";

export default async function GoBack(history: History) {
  let spy: jest.SpyInstance = jest.fn();

  expect(history.location).toMatchObject({
    pathname: "/",
  });

  history.push("/home");
  expect(history.action).toEqual("PUSH");
  expect(history.location).toMatchObject({
    pathname: "/home",
  });
  expect(spy).not.toHaveBeenCalled();

  // JSDom doesn't fire the listener synchronously :(
  let promise = new Promise((resolve) => {
    let unlisten = history.listen((...args) => {
      //@ts-expect-error
      spy(...args);
      unlisten();
      resolve(null);
    });
  });
  history.go(-1);
  await promise;
  expect(history.action).toEqual("POP");
  expect(history.location).toMatchObject({
    pathname: "/",
  });
  expect(spy).toHaveBeenCalledWith({
    action: "POP",
    delta: expect.any(Number),
    location: {
      hash: "",
      key: expect.any(String),
      pathname: "/",
      search: "",
      state: null,
    },
  });
  expect(spy.mock.calls.length).toBe(1);
}
