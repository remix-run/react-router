import type { History } from "../../index";

export default function InitialLocationHasKey(history: History) {
  expect(history.location.key).toBeTruthy();
}
