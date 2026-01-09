import { resolvePath } from "react-router";

describe("resolvePath", () => {
  it('resolves absolute paths irrespective of the "from" pathname', () => {
    expect(resolvePath("/search", "/inbox")).toMatchObject({
      pathname: "/search",
    });

    expect(resolvePath("/search/../123", "/inbox")).toMatchObject({
      pathname: "/123",
    });

    expect(resolvePath("/search/../../123", "/inbox")).toMatchObject({
      pathname: "/123",
    });

    expect(resolvePath("/search/user/../../123", "/inbox")).toMatchObject({
      pathname: "/123",
    });
  });

  it("resolves relative paths", () => {
    expect(resolvePath("../search", "/inbox")).toMatchObject({
      pathname: "/search",
    });

    expect(resolvePath("./search", "/inbox")).toMatchObject({
      pathname: "/inbox/search",
    });

    expect(resolvePath("./search/../123", "/inbox")).toMatchObject({
      pathname: "/inbox/123",
    });

    expect(resolvePath("search", "/inbox")).toMatchObject({
      pathname: "/inbox/search",
    });

    expect(resolvePath("search/../123", "/inbox")).toMatchObject({
      pathname: "/inbox/123",
    });

    expect(resolvePath("search/../../123", "/inbox")).toMatchObject({
      pathname: "/123",
    });

    expect(resolvePath("search/../../../123", "/inbox")).toMatchObject({
      pathname: "/123",
    });
  });

  it("normalizes any mid-path double-slashes", () => {
    let spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(resolvePath("/search/../..//foo")).toMatchObject({
      pathname: "/foo",
    });

    expect(resolvePath("search/../..//foo", "/inbox")).toMatchObject({
      pathname: "/foo",
    });

    spy.mockRestore();
  });

  it('ignores trailing slashes on the "from" pathname when resolving relative paths', () => {
    expect(resolvePath("../search", "/inbox/")).toMatchObject({
      pathname: "/search",
    });
  });

  it('uses the "from" pathname when the "to" value has no pathname', () => {
    expect(resolvePath("?q=react", "/search")).toMatchObject({
      pathname: "/search",
      search: "?q=react",
    });
  });

  it("normalizes search and hash values", () => {
    expect(
      resolvePath({ pathname: "/search", search: "q=react", hash: "results" }),
    ).toEqual({
      pathname: "/search",
      search: "?q=react",
      hash: "#results",
    });
  });
});
