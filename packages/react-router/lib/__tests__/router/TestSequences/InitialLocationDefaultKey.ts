import type { History } from "../../../router/history";

export default function InitialLocationDefaultKey(history: History) {
  expect(history.location.key).toBe("default");
}
