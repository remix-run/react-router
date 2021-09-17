import { matchPath } from "react-router";

describe("matchPath", () => {
  it("matches the root / URL", () => {
    let match = matchPath("/", "/")!;
    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      pathname: "/",
      pathnameStart: "/"
    });
  });

  it("matches a pathname", () => {
    let match = matchPath("users", "/users")!;
    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      pathname: "/users",
      pathnameStart: "/users"
    });
  });

  it("matches a pathname with multiple segments", () => {
    let match = matchPath("users/mj", "/users/mj")!;
    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      pathname: "/users/mj",
      pathnameStart: "/users/mj"
    });
  });

  it("matches a pathname with a trailing slash", () => {
    let match = matchPath("/users", "/users/")!;
    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      pathname: "/users/",
      pathnameStart: "/users/"
    });
  });

  it("matches a pathname with multiple segments and a trailing slash", () => {
    let match = matchPath("/users/mj", "/users/mj/")!;
    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      pathname: "/users/mj/",
      pathnameStart: "/users/mj/"
    });
  });

  describe("with a / pattern and { end: false }", () => {
    it("matches a pathname", () => {
      let match = matchPath({ path: "/", end: false }, "/users")!;
      expect(match).not.toBeNull();
      expect(match).toMatchObject({
        pathname: "/",
        pathnameStart: "/"
      });
    });

    it("matches a pathname with multiple segments", () => {
      let match = matchPath({ path: "/", end: false }, "/users/mj")!;
      expect(match).not.toBeNull();
      expect(match).toMatchObject({
        pathname: "/",
        pathnameStart: "/"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      let match = matchPath({ path: "/", end: false }, "/users/")!;
      expect(match).not.toBeNull();
      expect(match).toMatchObject({
        pathname: "/",
        pathnameStart: "/"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      let match = matchPath({ path: "/", end: false }, "/users/mj/")!;
      expect(match).not.toBeNull();
      expect(match).toMatchObject({
        pathname: "/",
        pathnameStart: "/"
      });
    });
  });

  it("is not case-sensitive by default", () => {
    let match = matchPath({ path: "/SystemDashboard" }, "/systemdashboard")!;
    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      pathname: "/systemdashboard",
      pathnameStart: "/systemdashboard"
    });
  });

  it("matches a case-sensitive pathname", () => {
    let match = matchPath(
      { path: "/SystemDashboard", caseSensitive: true },
      "/SystemDashboard"
    )!;
    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      pathname: "/SystemDashboard",
      pathnameStart: "/SystemDashboard"
    });
  });

  it("does not match a case-sensitive pathname with the wrong case", () => {
    let match = matchPath(
      { path: "/SystemDashboard", caseSensitive: true },
      "/systemDashboard"
    );
    expect(match).toBeNull();
  });

  describe("when the pattern has a trailing *", () => {
    it("matches the remaining portion of the pathname", () => {
      let match = matchPath("/files/*", "/files/mj.jpg")!;
      expect(match).not.toBeNull();
      expect(match).toMatchObject({
        params: { "*": "mj.jpg" },
        pathname: "/files/mj.jpg",
        pathnameStart: "/files"
      });
    });

    it("matches only after a slash", () => {
      let match = matchPath("/files/*", "/filestypo");
      expect(match).toBeNull();
    });
  });
});
