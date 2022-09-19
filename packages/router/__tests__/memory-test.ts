/* eslint-disable jest/expect-expect */

import type { MemoryHistory } from "@remix-run/router";
import { createMemoryHistory } from "@remix-run/router";

import Listen from "./TestSequences/Listen";
import InitialLocationHasKey from "./TestSequences/InitialLocationHasKey";
import PushNewLocation from "./TestSequences/PushNewLocation";
import PushSamePath from "./TestSequences/PushSamePath";
import PushState from "./TestSequences/PushState";
import PushMissingPathname from "./TestSequences/PushMissingPathname";
import PushRelativePathnameWarning from "./TestSequences/PushRelativePathnameWarning";
import ReplaceNewLocation from "./TestSequences/ReplaceNewLocation";
import ReplaceSamePath from "./TestSequences/ReplaceSamePath";
import ReplaceState from "./TestSequences/ReplaceState";
import EncodedReservedCharacters from "./TestSequences/EncodedReservedCharacters";
import GoBack from "./TestSequences/GoBack";
import GoForward from "./TestSequences/GoForward";
import ListenPopOnly from "./TestSequences/ListenPopOnly";

describe("a memory history", () => {
  let history: MemoryHistory;

  beforeEach(() => {
    history = createMemoryHistory();
  });

  it("has an index property", () => {
    expect(typeof history.index).toBe("number");
  });

  it("knows how to create hrefs", () => {
    const href = history.createHref({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
    });

    expect(href).toEqual("/the/path?the=query#the-hash");
  });

  it("knows how to create hrefs from strings", () => {
    const href = history.createHref("/the/path?the=query#the-hash");
    expect(href).toEqual("/the/path?the=query#the-hash");
  });

  it("does not encode the generated path", () => {
    const encodedHref = history.createHref({
      pathname: "/%23abc",
    });
    expect(encodedHref).toEqual("/%23abc");

    const unencodedHref = history.createHref({
      pathname: "/#abc",
    });
    expect(unencodedHref).toEqual("/#abc");
  });

  describe("the initial location", () => {
    it("has a key", () => {
      InitialLocationHasKey(history);
    });
  });

  describe("listen", () => {
    it("does not immediately call listeners", () => {
      Listen(history);
    });

    it("calls listeners only for POP actions", () => {
      ListenPopOnly(history);
    });
  });

  describe("push", () => {
    it("pushes the new location", () => {
      PushNewLocation(history);
    });

    it("pushes the same location", async () => {
      await PushSamePath(history);
    });

    it("pushes with state", () => {
      PushState(history);
    });

    it("reuses the current location pathname", () => {
      PushMissingPathname(history);
    });

    it("issues a warning on relative pathnames", () => {
      PushRelativePathnameWarning(history);
    });
  });

  describe("replace", () => {
    it("replaces with a new location", () => {
      ReplaceNewLocation(history);
    });
  });

  describe("replace the same path", () => {
    it("replaces with the same location", () => {
      ReplaceSamePath(history);
    });

    it("replaces the state", () => {
      ReplaceState(history);
    });
  });

  describe("location created with encoded/unencoded reserved characters", () => {
    it("produces different location objects", () => {
      EncodedReservedCharacters(history);
    });
  });

  describe("go", () => {
    it("goes back", async () => {
      await GoBack(history);
    });
    it("goes forward", async () => {
      await GoForward(history);
    });
  });
});

describe("a memory history without an onPopState callback", () => {
  it("fails gracefully on go() calls", () => {
    let history = createMemoryHistory();
    history.push("/page1");
    history.push("/page2");
    expect(history.location.pathname).toBe("/page2");
    history.go(-2);
    expect(history.location.pathname).toBe("/");
    history.go(1);
    expect(history.location.pathname).toBe("/page1");
  });
});

describe("a memory history with some initial entries", () => {
  it("clamps the initial index to a valid value", () => {
    let history = createMemoryHistory({
      initialEntries: ["/one", "/two", "/three"],
      initialIndex: 3, // invalid
    });

    expect(history.index).toBe(2);
  });

  it("starts at the last entry by default", () => {
    let history = createMemoryHistory({
      initialEntries: ["/one", "/two", "/three"],
    });

    expect(history.index).toBe(2);
    expect(history.location).toMatchObject({
      pathname: "/three",
      search: "",
      hash: "",
      state: null,
      key: expect.any(String),
    });

    history.go(-1);
    expect(history.index).toBe(1);
    expect(history.location).toMatchObject({
      pathname: "/two",
      search: "",
      hash: "",
      state: null,
      key: expect.any(String),
    });
  });

  it("allows initial entries to have state and keys", () => {
    let history = createMemoryHistory({
      initialEntries: [
        { pathname: "/one", state: "1", key: "1" },
        { pathname: "/two", state: "2", key: "2" },
      ],
    });

    expect(history.index).toBe(1);
    expect(history.location).toMatchObject({
      pathname: "/two",
      search: "",
      hash: "",
      state: "2",
      key: "2",
    });

    history.go(-1);
    expect(history.index).toBe(0);
    expect(history.location).toMatchObject({
      pathname: "/one",
      search: "",
      hash: "",
      state: "1",
      key: "1",
    });
  });
});
