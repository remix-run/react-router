import { jest } from "@jest/globals";

test("does not load route-pattern from the default router entry", async () => {
  let routePatternLoaded = false;

  jest.unstable_mockModule("@remix-run/route-pattern/match", () => {
    routePatternLoaded = true;
    return {};
  });
  jest.unstable_mockModule("@remix-run/route-pattern/specificity", () => {
    routePatternLoaded = true;
    return {};
  });

  await import("../../lib/router/router");

  expect(routePatternLoaded).toBe(false);
});
