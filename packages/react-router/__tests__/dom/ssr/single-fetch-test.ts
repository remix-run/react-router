import { singleFetchUrl } from "../../../lib/dom/ssr/single-fetch";

describe("singleFetchUrl", () => {
  it("should resolve to _root.data when path is /", () => {
    window.__reactRouterContext = {} as any;
    const actual = singleFetchUrl(`${window.location.origin}/`);
    expect(actual.toString()).toBe(`${window.location.origin}/_root.data`);
  });

  it("should resolve to _root.data when path is equal to basename", () => {
    window.__reactRouterContext = {} as any;
    window.__reactRouterContext!.basename = "/basename/";
    const actual = singleFetchUrl(`${window.location.origin}/basename/`);
    expect(actual.toString()).toBe(
      `${window.location.origin}/basename/_root.data`
    );
  });

  it("should resolve to path.data when path is not to base", () => {
    window.__reactRouterContext = {} as any;
    const actual = singleFetchUrl(`${window.location.origin}/path/`);
    expect(actual.toString()).toBe(`${window.location.origin}/path.data`);
  });
});
