import { matchPath } from "react-router";

describe("matchPath", () => {
  it("matches the root / URL", () => {
    expect(matchPath("/", "/")).toMatchObject({
      pathname: "/",
      pathnameBase: "/"
    });
  });

  describe("when the pattern has no leading slash", () => {
    it("fails to match a pathname that does not match", () => {
      expect(matchPath("users", "/usersblah")).toBeNull();
    });

    it("matches a pathname", () => {
      expect(matchPath("users", "/users")).toMatchObject({
        pathname: "/users",
        pathnameBase: "/users"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath("users/mj", "/users/mj")).toMatchObject({
        pathname: "/users/mj",
        pathnameBase: "/users/mj"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath("users", "/users/")).toMatchObject({
        pathname: "/users/",
        pathnameBase: "/users"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath("users/mj", "/users/mj/")).toMatchObject({
        pathname: "/users/mj/",
        pathnameBase: "/users/mj"
      });
    });
  });

  describe("when the pattern has a leading slash", () => {
    it("fails to match a pathname that does not match", () => {
      expect(matchPath("/users", "/usersblah")).toBeNull();
    });

    it("matches a pathname", () => {
      expect(matchPath("/users", "/users")).toMatchObject({
        pathname: "/users",
        pathnameBase: "/users"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath("/users/mj", "/users/mj")).toMatchObject({
        pathname: "/users/mj",
        pathnameBase: "/users/mj"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath("/users", "/users/")).toMatchObject({
        pathname: "/users/",
        pathnameBase: "/users"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath("/users/mj", "/users/mj/")).toMatchObject({
        pathname: "/users/mj/",
        pathnameBase: "/users/mj"
      });
    });
  });

  describe("when the pattern has a trailing slash", () => {
    it("fails to match a pathname that does not match", () => {
      expect(matchPath("users/", "/usersblah")).toBeNull();
    });

    it("matches a pathname", () => {
      expect(matchPath("users/", "/users")).toMatchObject({
        pathname: "/users",
        pathnameBase: "/users"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath("users/mj/", "/users/mj")).toMatchObject({
        pathname: "/users/mj",
        pathnameBase: "/users/mj"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath("users/", "/users/")).toMatchObject({
        pathname: "/users/",
        pathnameBase: "/users"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath("users/mj/", "/users/mj/")).toMatchObject({
        pathname: "/users/mj/",
        pathnameBase: "/users/mj"
      });
    });
  });

  describe("with { end: false }", () => {
    it("matches the beginning of a pathname", () => {
      expect(matchPath({ path: "/users", end: false }, "/users")).toMatchObject(
        { pathname: "/users", pathnameBase: "/users" }
      );
      expect(
        matchPath({ path: "/users/", end: false }, "/users")
      ).toMatchObject({
        pathname: "/users",
        pathnameBase: "/users"
      });
    });

    it("matches the beginning of a pathname with a trailing slash", () => {
      expect(
        matchPath({ path: "/users", end: false }, "/users/")
      ).toMatchObject({ pathname: "/users", pathnameBase: "/users" });
      expect(
        matchPath({ path: "/users/", end: false }, "/users/")
      ).toMatchObject({
        pathname: "/users",
        pathnameBase: "/users"
      });
    });

    it("matches the beginning of a pathname with multiple segments", () => {
      expect(
        matchPath({ path: "/users", end: false }, "/users/mj")
      ).toMatchObject({ pathname: "/users", pathnameBase: "/users" });
      expect(
        matchPath({ path: "/users/", end: false }, "/users/mj")
      ).toMatchObject({ pathname: "/users", pathnameBase: "/users" });
    });

    it("matches the beginning of a pathname with multiple segments and a trailing slash", () => {
      expect(
        matchPath({ path: "/users", end: false }, "/users/mj/")
      ).toMatchObject({ pathname: "/users", pathnameBase: "/users" });
      expect(
        matchPath({ path: "/users/", end: false }, "/users/mj/")
      ).toMatchObject({ pathname: "/users", pathnameBase: "/users" });
    });

    it("fails to match a pathname where the segments do not match", () => {
      expect(matchPath({ path: "/users", end: false }, "/")).toBeNull();
      expect(matchPath({ path: "/users", end: false }, "/users2")).toBeNull();
      expect(
        matchPath({ path: "/users/mj", end: false }, "/users/mj2")
      ).toBeNull();
    });
  });

  describe("with { end: false } and a / pattern", () => {
    it("matches a pathname", () => {
      expect(matchPath({ path: "/", end: false }, "/users")).toMatchObject({
        pathname: "/",
        pathnameBase: "/"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath({ path: "/", end: false }, "/users/mj")).toMatchObject({
        pathname: "/",
        pathnameBase: "/"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath({ path: "/", end: false }, "/users/")).toMatchObject({
        pathname: "/",
        pathnameBase: "/"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath({ path: "/", end: false }, "/users/mj/")).toMatchObject({
        pathname: "/",
        pathnameBase: "/"
      });
    });
  });

  it("is not case-sensitive by default", () => {
    expect(matchPath("/SystemDashboard", "/systemdashboard")).toMatchObject({
      pathname: "/systemdashboard",
      pathnameBase: "/systemdashboard"
    });
  });

  it("matches a case-sensitive pathname", () => {
    expect(
      matchPath(
        { path: "/SystemDashboard", caseSensitive: true },
        "/SystemDashboard"
      )
    ).toMatchObject({
      pathname: "/SystemDashboard",
      pathnameBase: "/SystemDashboard"
    });
  });

  it("does not match a case-sensitive pathname with the wrong case", () => {
    expect(
      matchPath(
        { path: "/SystemDashboard", caseSensitive: true },
        "/systemDashboard"
      )
    ).toBeNull();
  });

  describe("when the pattern has a trailing /*", () => {
    it("matches the remaining portion of the pathname", () => {
      expect(matchPath("/files/*", "/files/mj.jpg")).toMatchObject({
        params: { "*": "mj.jpg" },
        pathname: "/files/mj.jpg",
        pathnameBase: "/files"
      });
      expect(matchPath("/files/*", "/files/")).toMatchObject({
        params: { "*": "" },
        pathname: "/files/",
        pathnameBase: "/files"
      });
      expect(matchPath("/files/*", "/files")).toMatchObject({
        params: { "*": "" },
        pathname: "/files",
        pathnameBase: "/files"
      });
    });
  });
});

describe("matchPath *", () => {
  it("matches the root URL", () => {
    expect(matchPath("*", "/")).toMatchObject({
      pathname: "/",
      pathnameBase: "/"
    });
    expect(matchPath("/*", "/")).toMatchObject({
      pathname: "/",
      pathnameBase: "/"
    });
  });

  it("matches a URL with a segment", () => {
    expect(matchPath("*", "/users")).toMatchObject({
      pathname: "/users",
      pathnameBase: "/"
    });
    expect(matchPath("/*", "/users")).toMatchObject({
      pathname: "/users",
      pathnameBase: "/"
    });
  });

  it("matches a URL with a segment and a trailing slash", () => {
    expect(matchPath("*", "/users/")).toMatchObject({
      pathname: "/users/",
      pathnameBase: "/"
    });
    expect(matchPath("/*", "/users/")).toMatchObject({
      pathname: "/users/",
      pathnameBase: "/"
    });
  });

  it("matches a URL with multiple segments", () => {
    expect(matchPath("*", "/users/mj")).toMatchObject({
      pathname: "/users/mj",
      pathnameBase: "/"
    });
    expect(matchPath("/*", "/users/mj")).toMatchObject({
      pathname: "/users/mj",
      pathnameBase: "/"
    });
  });

  it("matches a URL with multiple segments and a trailing slash", () => {
    expect(matchPath("*", "/users/mj/")).toMatchObject({
      pathname: "/users/mj/",
      pathnameBase: "/"
    });
    expect(matchPath("/*", "/users/mj/")).toMatchObject({
      pathname: "/users/mj/",
      pathnameBase: "/"
    });
  });
});

describe("matchPath warnings", () => {
  let consoleWarn: jest.SpyInstance<void, any>;
  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  describe("when the pattern has a trailing *", () => {
    it("issues a warning and matches the remaining portion of the pathname", () => {
      expect(matchPath("/files*", "/files/mj.jpg")).toMatchObject({
        params: { "*": "mj.jpg" },
        pathname: "/files/mj.jpg",
        pathnameBase: "/files"
      });
      expect(consoleWarn).toHaveBeenCalledTimes(1);

      expect(matchPath("/files*", "/files/")).toMatchObject({
        params: { "*": "" },
        pathname: "/files/",
        pathnameBase: "/files"
      });
      expect(consoleWarn).toHaveBeenCalledTimes(2);

      expect(matchPath("/files*", "/files")).toMatchObject({
        params: { "*": "" },
        pathname: "/files",
        pathnameBase: "/files"
      });
      expect(consoleWarn).toHaveBeenCalledTimes(3);
    });
  });
});
