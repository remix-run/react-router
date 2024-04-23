import { createPath } from "@remix-run/router";

describe("createPath", () => {
  describe("given only a pathname", () => {
    it("returns the pathname unchanged", () => {
      let path = createPath({ pathname: "https://google.com" });
      expect(path).toBe("https://google.com");
    });
  });

  describe("given a pathname and a search param", () => {
    it("returns the constructed pathname", () => {
      let path = createPath({
        pathname: "https://google.com",
        search: "?something=cool",
      });
      expect(path).toBe("https://google.com?something=cool");
    });
  });

  describe("given a pathname and a search param without ?", () => {
    it("returns the constructed pathname", () => {
      let path = createPath({
        pathname: "https://google.com",
        search: "something=cool",
      });
      expect(path).toBe("https://google.com?something=cool");
    });
  });

  describe("given a pathname and a hash param", () => {
    it("returns the constructed pathname", () => {
      let path = createPath({
        pathname: "https://google.com",
        hash: "#section-1",
      });
      expect(path).toBe("https://google.com#section-1");
    });
  });

  describe("given a pathname and a hash param without #", () => {
    it("returns the constructed pathname", () => {
      let path = createPath({
        pathname: "https://google.com",
        hash: "section-1",
      });
      expect(path).toBe("https://google.com#section-1");
    });
  });

  describe("given a full location object", () => {
    it("returns the constructed pathname", () => {
      let path = createPath({
        pathname: "https://google.com",
        search: "something=cool",
        hash: "#section-1",
      });
      expect(path).toBe("https://google.com?something=cool#section-1");
    });
  });
});
