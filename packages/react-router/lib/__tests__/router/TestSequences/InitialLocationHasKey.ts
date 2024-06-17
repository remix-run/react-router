import type { History } from "../../../router/history";

export default function InitialLocationHasKey(history: History) {
  expect(history.location.key).toBeTruthy();
}
