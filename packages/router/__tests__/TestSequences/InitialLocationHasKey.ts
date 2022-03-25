import type { History } from "../../history";

export default function InitialLocationHasKey(history: History) {
  expect(history.location.key).toBeTruthy();
}
