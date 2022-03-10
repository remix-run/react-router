import type { History } from "../../index";

export default function InitialLocationDefaultKey(history: History) {
  expect(history.location.key).toBe("default");
}
