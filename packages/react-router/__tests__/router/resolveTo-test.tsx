import { resolveTo } from "../../lib/router/utils";

describe("resolveTo", () => {
  it('resolve path without mutating the "to" argument', () => {
    const toArg = {
      pathname: "../../create",
    };

    const routePathnames = ["/", "/user", "/user/1", "/user/1/edit"];
    const locationPathname = "/user/1/edit/";

    let resolvedPath = resolveTo(toArg, routePathnames, locationPathname);
    expect(resolvedPath).toEqual({
      pathname: "/user/create",
      search: "",
      hash: "",
    });

    resolvedPath = resolveTo(toArg, routePathnames, locationPathname);
    expect(resolvedPath).toEqual({
      pathname: "/user/create",
      search: "",
      hash: "",
    });
  });

  it("should handle relative paths with colons", () => {
    const routePathnames = ["/", "/base"];
    const locationPathname = "/base";

    // Paths with colons should be resolved as relative paths
    let resolvedPath = resolveTo(
      { pathname: "my-path:with-colon" },
      routePathnames,
      locationPathname,
    );
    expect(resolvedPath.pathname).toBe("/base/my-path:with-colon");

    // Another example with different colon pattern
    resolvedPath = resolveTo(
      { pathname: "item:123" },
      routePathnames,
      locationPathname,
    );
    expect(resolvedPath.pathname).toBe("/base/item:123");

    // Prefixing with ./ should also work
    resolvedPath = resolveTo(
      { pathname: "./my-path:with-colon" },
      routePathnames,
      locationPathname,
    );
    expect(resolvedPath.pathname).toBe("/base/my-path:with-colon");
  });

  it("should still recognize actual absolute URLs", () => {
    const routePathnames = ["/", "/base"];
    const locationPathname = "/base";

    // Hierarchical URLs with ://
    let resolvedPath = resolveTo(
      { pathname: "http://localhost" },
      routePathnames,
      locationPathname,
    );
    expect(resolvedPath.pathname).toBe("http://localhost");

    // Non-hierarchical schemes like mailto: should be treated as absolute URLs
    resolvedPath = resolveTo(
      { pathname: "mailto:test@example.com" },
      routePathnames,
      locationPathname,
    );
    expect(resolvedPath.pathname).toBe("mailto:test@example.com");

    // Protocol-relative URLs
    resolvedPath = resolveTo(
      { pathname: "//example.com/path" },
      routePathnames,
      locationPathname,
    );
    expect(resolvedPath.pathname).toBe("//example.com/path");
  });
});
