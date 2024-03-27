import type { History } from "../../history";

export default function InitialLocationDefaultKey(history: History) {
  expect(history.location.key).toBe("default");
}
