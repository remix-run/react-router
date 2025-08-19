import type { History } from "../../../lib/router/history";

export default function InitialLocationHasKey(history: History) {
  expect(history.location.key).toBeTruthy();
}
