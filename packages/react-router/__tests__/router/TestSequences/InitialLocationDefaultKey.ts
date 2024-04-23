import type { History } from "../../../lib/router/history";

export default function InitialLocationDefaultKey(history: History) {
  expect(history.location.key).toBe("default");
}
