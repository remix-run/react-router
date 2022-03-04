import type { History } from "../../index";

export default function Listen(history: History) {
  let spy = jest.fn();
  let unlisten = history.listen(spy);

  history.push("/2");
  expect(history.location.pathname).toBe("/2");
  history.replace("/3");
  expect(history.location.pathname).toBe("/3");

  expect(spy).not.toHaveBeenCalled();
  unlisten();
}
