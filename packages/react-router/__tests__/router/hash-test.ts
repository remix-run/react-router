/* eslint-disable jest/expect-expect */

import { JSDOM } from "jsdom";

import type { HashHistory } from "../../lib/router/history";
import { createHashHistory } from "../../lib/router/history";

import Listen from "./TestSequences/Listen";
import InitialLocationDefaultKey from "./TestSequences/InitialLocationDefaultKey";
import PushNewLocation from "./TestSequences/PushNewLocation";
import PushSamePath from "./TestSequences/PushSamePath";
import PushState from "./TestSequences/PushState";
import PushStateInvalid from "./TestSequences/PushStateInvalid";
import PushMissingPathname from "./TestSequences/PushMissingPathname";
import PushRelativePathnameWarning from "./TestSequences/PushRelativePathnameWarning";
import ReplaceNewLocation from "./TestSequences/ReplaceNewLocation";
import ReplaceSamePath from "./TestSequences/ReplaceSamePath";
import ReplaceState from "./TestSequences/ReplaceState";
import EncodedReservedCharacters from "./TestSequences/EncodedReservedCharacters";
import GoBack from "./TestSequences/GoBack";
import GoForward from "./TestSequences/GoForward";
import ListenPopOnly from "./TestSequences/ListenPopOnly";

// TODO: Do we still need this?
// const canGoWithoutReload = window.navigator.userAgent.indexOf('Firefox') === -1;
// const describeGo = canGoWithoutReload ? describe : describe.skip;

describe("a hash history", () => {
  let history: HashHistory;
  let dom: JSDOM;

  beforeEach(() => {
    // Need to use our own custom DOM in order to get a working history
    dom = new JSDOM(`<!DOCTYPE html><p>History Example</p>`, {
      url: "https://example.org/",
    });
    dom.window.history.replaceState(null, "", "#/");
    history = createHashHistory({ window: dom.window as unknown as Window });
  });

  it("knows how to create hrefs from location objects", () => {
    const href = history.createHref({
      pathname: "/the/path",
      search: "?the=query",
      hash: "#the-hash",
    });

    expect(href).toEqual("#/the/path?the=query#the-hash");
  });

  it("knows how to create hrefs from strings", () => {
    const href = history.createHref("/the/path?the=query#the-hash");
    expect(href).toEqual("#/the/path?the=query#the-hash");
  });

  it("does not encode the generated path", () => {
    const encodedHref = history.createHref({
      pathname: "/%23abc",
    });
    expect(encodedHref).toEqual("#/%23abc");

    const unencodedHref = history.createHref({
      pathname: "/#abc",
    });
    expect(unencodedHref).toEqual("#/#abc");
  });

  it("prefixes raw hash values with /", () => {
    let spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    dom.window.history.replaceState(null, "", "#hello");
    history = createHashHistory({ window: dom.window as unknown as Window });
    expect(history.location.pathname).toBe("/hello");

    history.push("world");
    expect(history.location.pathname).toBe("/world");

    // Not supported but ensure we don't prefix here
    history.push("./relative");
    expect(history.location.pathname).toBe("./relative");

    history.push("../relative");
    expect(history.location.pathname).toBe("../relative");

    spy.mockReset();
  });

  describe("listen", () => {
    it("does not immediately call listeners", () => {
      Listen(history);
    });

    it("calls listeners only for POP actions", () => {
      ListenPopOnly(history);
    });
  });

  describe("the initial location", () => {
    it('has the "default" key', () => {
      InitialLocationDefaultKey(history);
    });
  });

  describe("push a new path", () => {
    it("calls change listeners with the new location", () => {
      PushNewLocation(history);
    });
  });

  describe("push the same path", () => {
    it("calls change listeners with the new location", async () => {
      await PushSamePath(history);
    });
  });

  describe("push state", () => {
    it("calls change listeners with the new location", () => {
      PushState(history);
    });

    it("re-throws when using non-serializable state", () => {
      PushStateInvalid(history, dom.window);
    });
  });

  describe("push with no pathname", () => {
    it("reuses the current location pathname", () => {
      PushMissingPathname(history);
    });
  });

  describe("push with a relative pathname", () => {
    it("issues a warning", () => {
      PushRelativePathnameWarning(history);
    });
  });

  describe("replace a new path", () => {
    it("calls change listeners with the new location", () => {
      ReplaceNewLocation(history);
    });
  });

  describe("replace the same path", () => {
    it("calls change listeners with the new location", () => {
      ReplaceSamePath(history);
    });
  });

  describe("replace state", () => {
    it("calls change listeners with the new location", () => {
      ReplaceState(history);
    });
  });

  describe("location created with encoded/unencoded reserved characters", () => {
    it("produces different location objects", () => {
      EncodedReservedCharacters(history);
    });
  });

  describe("back", () => {
    it("calls change listeners with the previous location", async () => {
      await GoBack(history);
    });
  });

  describe("forward", () => {
    it("calls change listeners with the next location", async () => {
      await GoForward(history);
    });
  });
});
