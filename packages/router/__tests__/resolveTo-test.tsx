import { resolveTo } from "@remix-run/router";

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
});
