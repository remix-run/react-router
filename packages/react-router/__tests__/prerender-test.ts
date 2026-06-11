import { mockEntryContext } from "./utils/framework";

describe("prerender", () => {
  it("mockEntryContext defaults isPrerender to false", () => {
    let ctx = mockEntryContext();
    expect(ctx.isPrerender).toBe(false);
  });

  it("mockEntryContext accepts isPrerender override", () => {
    let ctx = mockEntryContext({ isPrerender: true });
    expect(ctx.isPrerender).toBe(true);
  });
});
