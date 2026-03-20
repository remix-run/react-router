import { getDefaultExternalConditions } from "./external-conditions";

describe("getDefaultExternalConditions", () => {
  test("does not force node-specific resolution for workers-compatible environments", () => {
    expect(getDefaultExternalConditions()).toEqual([]);
    expect(getDefaultExternalConditions()).not.toContain("node");
  });
});
