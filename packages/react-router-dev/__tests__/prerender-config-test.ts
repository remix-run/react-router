import { validatePrerenderConfig } from "../config/config";
import { getPrerenderConfig } from "../vite/plugin";

describe("validatePrerenderConfig", () => {
  it("allows valid boolean, array, function, and object configs", () => {
    expect(validatePrerenderConfig(true)).toBeUndefined();
    expect(validatePrerenderConfig(false)).toBeUndefined();
    expect(validatePrerenderConfig(["/", "/about"])).toBeUndefined();
    expect(validatePrerenderConfig(() => ["/"])).toBeUndefined();
    expect(validatePrerenderConfig({ paths: ["/", "/about"] })).toBeUndefined();
    expect(
      validatePrerenderConfig({
        paths: ["/", "/about"],
        concurrency: 1,
        timeout: 60_000,
        retryCount: 2,
        retryDelay: 1000,
        maxRedirects: 5,
      }),
    ).toBeUndefined();
    expect(
      validatePrerenderConfig({
        paths: ["/"],
        concurrency: 1,
        timeout: 0,
        retryCount: 0,
        retryDelay: 0,
        maxRedirects: 0,
      }),
    ).toBeUndefined();
  });

  it("rejects invalid prerender paths config", () => {
    expect(validatePrerenderConfig(123)).toMatch(
      "The `prerender`/`prerender.paths` config must be a boolean",
    );
    expect(validatePrerenderConfig({ paths: 123 as any })).toMatch(
      "The `prerender`/`prerender.paths` config must be a boolean",
    );
  });

  it("warns about deprecated unstable_concurrency", () => {
    expect(
      validatePrerenderConfig({
        paths: ["/"],
        unstable_concurrency: 2,
      } as any),
    ).toBe(
      "The `prerender.unstable_concurrency` config field has been stabilized as `prerender.concurrency`",
    );
  });

  it("validates concurrency", () => {
    expect(validatePrerenderConfig({ paths: ["/"], concurrency: 0 })).toBe(
      "The `prerender.concurrency` config must be a positive integer if specified.",
    );
    expect(validatePrerenderConfig({ paths: ["/"], concurrency: -1 })).toBe(
      "The `prerender.concurrency` config must be a positive integer if specified.",
    );
    expect(validatePrerenderConfig({ paths: ["/"], concurrency: 1.5 })).toBe(
      "The `prerender.concurrency` config must be a positive integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], concurrency: "1" as any }),
    ).toBe(
      "The `prerender.concurrency` config must be a positive integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], concurrency: undefined }),
    ).toBeUndefined();
  });

  it("validates timeout", () => {
    expect(validatePrerenderConfig({ paths: ["/"], timeout: -1 })).toBe(
      "The `prerender.timeout` config must be a non-negative integer if specified.",
    );
    expect(validatePrerenderConfig({ paths: ["/"], timeout: 10.5 })).toBe(
      "The `prerender.timeout` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], timeout: "10000" as any }),
    ).toBe(
      "The `prerender.timeout` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], timeout: undefined }),
    ).toBeUndefined();
  });

  it("validates retryCount", () => {
    expect(validatePrerenderConfig({ paths: ["/"], retryCount: -1 })).toBe(
      "The `prerender.retryCount` config must be a non-negative integer if specified.",
    );
    expect(validatePrerenderConfig({ paths: ["/"], retryCount: 2.5 })).toBe(
      "The `prerender.retryCount` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], retryCount: "2" as any }),
    ).toBe(
      "The `prerender.retryCount` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], retryCount: undefined }),
    ).toBeUndefined();
  });

  it("validates retryDelay", () => {
    expect(validatePrerenderConfig({ paths: ["/"], retryDelay: -100 })).toBe(
      "The `prerender.retryDelay` config must be a non-negative integer if specified.",
    );
    expect(validatePrerenderConfig({ paths: ["/"], retryDelay: 50.5 })).toBe(
      "The `prerender.retryDelay` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], retryDelay: "500" as any }),
    ).toBe(
      "The `prerender.retryDelay` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], retryDelay: undefined }),
    ).toBeUndefined();
  });

  it("validates maxRedirects", () => {
    expect(validatePrerenderConfig({ paths: ["/"], maxRedirects: -1 })).toBe(
      "The `prerender.maxRedirects` config must be a non-negative integer if specified.",
    );
    expect(validatePrerenderConfig({ paths: ["/"], maxRedirects: 3.5 })).toBe(
      "The `prerender.maxRedirects` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], maxRedirects: "5" as any }),
    ).toBe(
      "The `prerender.maxRedirects` config must be a non-negative integer if specified.",
    );
    expect(
      validatePrerenderConfig({ paths: ["/"], maxRedirects: undefined }),
    ).toBeUndefined();
  });
});

describe("getPrerenderConfig", () => {
  it("defaults concurrency to 1 when prerender is boolean, array, function, or not specified", () => {
    expect(getPrerenderConfig({} as any)).toEqual({ concurrency: 1 });
    expect(getPrerenderConfig({ prerender: undefined } as any)).toEqual({
      concurrency: 1,
    });
    expect(getPrerenderConfig({ prerender: false } as any)).toEqual({
      concurrency: 1,
    });
    expect(getPrerenderConfig({ prerender: true } as any)).toEqual({
      concurrency: 1,
    });
    expect(getPrerenderConfig({ prerender: ["/", "/about"] } as any)).toEqual({
      concurrency: 1,
    });
    expect(
      getPrerenderConfig({ prerender: () => ["/", "/about"] } as any),
    ).toEqual({
      concurrency: 1,
    });
    expect(getPrerenderConfig({ prerender: { paths: ["/"] } } as any)).toEqual({
      concurrency: 1,
    });
  });

  it("forwards all custom options when specified", () => {
    expect(
      getPrerenderConfig({
        prerender: {
          paths: ["/", "/about"],
          concurrency: 1,
          timeout: 60_000,
          retryCount: 2,
          retryDelay: 1000,
          maxRedirects: 5,
        },
      } as any),
    ).toEqual({
      concurrency: 1,
      timeout: 60_000,
      retryCount: 2,
      retryDelay: 1000,
      maxRedirects: 5,
    });
  });

  it("forwards partial options and does not add undefined keys for omitted options", () => {
    const config = getPrerenderConfig({
      prerender: {
        paths: ["/"],
        timeout: 30_000,
        retryCount: 3,
      },
    } as any);

    expect(config).toEqual({
      concurrency: 1,
      timeout: 30_000,
      retryCount: 3,
    });
    expect("retryDelay" in config).toBe(false);
    expect("maxRedirects" in config).toBe(false);
  });

  it("preserves zero values without falling back to defaults", () => {
    const config = getPrerenderConfig({
      prerender: {
        paths: ["/"],
        concurrency: 2,
        timeout: 0,
        retryCount: 0,
        retryDelay: 0,
        maxRedirects: 0,
      },
    } as any);

    expect(config).toEqual({
      concurrency: 2,
      timeout: 0,
      retryCount: 0,
      retryDelay: 0,
      maxRedirects: 0,
    });
  });
});
