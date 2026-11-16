import { singleFetchUrl } from "../../../lib/dom/ssr/single-fetch";

describe("singleFetchUrl", () => {
  it("uses the configured server origin", () => {
    expect(
      singleFetchUrl(
        "/dashboard?index",
        "data",
        "https://api.example.com/",
      ).toString(),
    ).toBe("https://api.example.com/dashboard.data?index");
  });

  it("uses the request origin when no server origin is configured", () => {
    expect(
      singleFetchUrl("https://app.example.com/dashboard", "data").toString(),
    ).toBe("https://app.example.com/dashboard.data");
  });
});
