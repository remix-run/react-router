import { matchPath } from "react-router";

describe("matchPath", () => {
  it("matches the root / URL", () => {
    expect(matchPath("/", "/")).toMatchObject({ pathname: "/" });
  });

  describe("when the pattern has no leading slash", () => {
    it("fails to match a pathname that does not match", () => {
      expect(matchPath("users", "/usersblah")).toBeNull();
    });

    it("matches a pathname", () => {
      expect(matchPath("users", "/users")).toMatchObject({
        pathname: "/users"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath("users/mj", "/users/mj")).toMatchObject({
        pathname: "/users/mj"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath("users", "/users/")).toMatchObject({
        pathname: "/users/"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath("users/mj", "/users/mj/")).toMatchObject({
        pathname: "/users/mj/"
      });
    });
  });

  describe("when the pattern has a leading slash", () => {
    it("fails to match a pathname that does not match", () => {
      expect(matchPath("/users", "/usersblah")).toBeNull();
    });

    it("matches a pathname", () => {
      expect(matchPath("/users", "/users")).toMatchObject({
        pathname: "/users"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath("/users/mj", "/users/mj")).toMatchObject({
        pathname: "/users/mj"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath("/users", "/users/")).toMatchObject({
        pathname: "/users/"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath("/users/mj", "/users/mj/")).toMatchObject({
        pathname: "/users/mj/"
      });
    });
  });

  describe("when the pattern has a trailing slash", () => {
    it("fails to match a pathname that does not match", () => {
      expect(matchPath("users/", "/usersblah")).toBeNull();
    });

    it("matches a pathname", () => {
      expect(matchPath("users/", "/users")).toMatchObject({
        pathname: "/users"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath("users/mj/", "/users/mj")).toMatchObject({
        pathname: "/users/mj"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath("users/", "/users/")).toMatchObject({
        pathname: "/users/"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath("users/mj/", "/users/mj/")).toMatchObject({
        pathname: "/users/mj/"
      });
    });
  });

  describe("with { end: false }", () => {
    it("matches the beginning of a pathname", () => {
      expect(matchPath({ path: "/users", end: false }, "/users")).toMatchObject(
        { pathname: "/users" }
      );
    });

    it("matches the beginning of a pathname with multiple segments", () => {
      expect(
        matchPath({ path: "/users", end: false }, "/users/mj")
      ).toMatchObject({ pathname: "/users" });
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
        pathname: "/"
      });
    });

    it("matches a pathname with multiple segments", () => {
      expect(matchPath({ path: "/", end: false }, "/users/mj")).toMatchObject({
        pathname: "/"
      });
    });

    it("matches a pathname with a trailing slash", () => {
      expect(matchPath({ path: "/", end: false }, "/users/")).toMatchObject({
        pathname: "/"
      });
    });

    it("matches a pathname with multiple segments and a trailing slash", () => {
      expect(matchPath({ path: "/", end: false }, "/users/mj/")).toMatchObject({
        pathname: "/"
      });
    });
  });

  it("is not case-sensitive by default", () => {
    expect(matchPath("/SystemDashboard", "/systemdashboard")).toMatchObject({
      pathname: "/systemdashboard"
    });
  });

  it("matches a case-sensitive pathname", () => {
    expect(
      matchPath(
        { path: "/SystemDashboard", caseSensitive: true },
        "/SystemDashboard"
      )
    ).toMatchObject({
      pathname: "/SystemDashboard"
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

  describe("when the pattern has a trailing *", () => {
    it("matches the remaining portion of the pathname", () => {
      expect(matchPath("/files*", "/files/mj.jpg")).toMatchObject({
        params: { "*": "/mj.jpg" },
        pathname: "/files/mj.jpg"
      });
      expect(matchPath("/files*", "/files/")).toMatchObject({
        params: { "*": "/" },
        pathname: "/files/"
      });
      expect(matchPath("/files*", "/files")).toMatchObject({
        params: { "*": "" },
        pathname: "/files"
      });
    });
  });

  describe("when the pattern has a trailing /*", () => {
    it("matches the remaining portion of the pathname", () => {
      expect(matchPath("/files/*", "/files/mj.jpg")).toMatchObject({
        params: { "*": "mj.jpg" },
        pathname: "/files/mj.jpg"
      });
      expect(matchPath("/files/*", "/files/")).toMatchObject({
        params: { "*": "" },
        pathname: "/files/"
      });
      expect(matchPath("/files/*", "/files")).toMatchObject({
        params: { "*": "" },
        pathname: "/files"
      });
    });
  });
});
