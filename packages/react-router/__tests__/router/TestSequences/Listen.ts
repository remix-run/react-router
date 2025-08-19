import type { History } from "../../../lib/router/history";

export default function Listen(history: History) {
  let spy = jest.fn();
  let unlisten = history.listen(spy);

  expect(spy).not.toHaveBeenCalled();

  unlisten();
}
