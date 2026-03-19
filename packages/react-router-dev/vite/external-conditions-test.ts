import { getDefaultExternalConditions } from "./external-conditions";

describe("getDefaultExternalConditions", () => {
  test("does not force node-specific resolution by default", () => {
    expect(getDefaultExternalConditions()).toEqual([]);
    expect(getDefaultExternalConditions()).not.toContain("node");
  });
});
