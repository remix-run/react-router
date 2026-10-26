/* eslint-disable jest/expect-expect */

import {
  type BrowserHistory,
  createBrowserHistory,
} from "../../lib/router/history";

import InitialLocationDefaultKey from "./TestSequences/InitialLocationDefaultKey";
import Listen from "./TestSequences/Listen";
import PushNewLocation from "./TestSequences/PushNewLocation";
import PushSamePath from "./TestSequences/PushSamePath";
import PushState from "./TestSequences/PushState";
import PushStateInvalid from "./TestSequences/PushStateInvalid";
import PushMissingPathname from "./TestSequences/PushMissingPathname";
import PushRelativePathname from "./TestSequences/PushRelativePathname";
import ReplaceNewLocation from "./TestSequences/ReplaceNewLocation";
import ReplaceSamePath from "./TestSequences/ReplaceSamePath";
import ReplaceState from "./TestSequences/ReplaceState";
import EncodedReservedCharacters from "./TestSequences/EncodedReservedCharacters";
import GoBack from "./TestSequences/GoBack";
import GoForward from "./TestSequences/GoForward";
import ListenPopOnly from "./TestSequences/ListenPopOnly";
import getWindow from "../utils/getWindow";

describe("a browser history", () => {
  let history: BrowserHistory;
  let testWindow: Window;

  beforeEach(() => {
    // Need to use our own custom DOM in order to get a working history
    testWindow = getWindow("/");
    history = createBrowserHistory({ window: testWindow });
  });

  it("knows how to create hrefs from location objects", () => {
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

  it("uses the configured window when creating URLs", () => {
    const customWindow = getWindow("/", false, "https://example.com");
    const customHistory = createBrowserHistory({ window: customWindow });

    expect(customHistory.createURL("/test").origin).toBe("https://example.com");
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
      PushStateInvalid(history, testWindow);
    });
  });

  describe("push with no pathname", () => {
    it("reuses the current location pathname", () => {
      PushMissingPathname(history);
    });
  });

  describe("push with a relative pathname", () => {
    it("normalizes the pathname relative to the current location", () => {
      PushRelativePathname(history);
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

  // An entry created outside the router (a `#hash` link, `history.pushState`)
  // carries no index, and a `popstate` the browser didn't cause (single-spa
  // fires one after each push) doesn't change the entry. The step of such a
  // POP can't be known.
  describe("a POP whose step can't be known", () => {
    function nextPop() {
      return new Promise<number | null>((resolve) => {
        let unlisten = history.listen(({ delta }) => {
          unlisten();
          resolve(delta);
        });
      });
    }

    it("reports no delta, rather than a wrong one, in either direction", async () => {
      history.push("/a"); // idx 1
      testWindow.history.pushState(null, "", "/a#section"); // no idx

      // Back from the unseen entry lands on the index the history stands at.
      let pop = nextPop();
      testWindow.history.back();
      expect(await pop).toBe(null); // was 0: a blocker would call go(0)

      // Forward onto the entry with no index.
      pop = nextPop();
      testWindow.history.forward();
      expect(await pop).toBe(null);

      // Back again, leaving the entry with no index.
      pop = nextPop();
      testWindow.history.back();
      expect(await pop).toBe(null); // was 1 (1 - null): the wrong direction
      expect(history.location.pathname).toBe("/a");
    });

    it("reports no delta for a popstate that doesn't change the entry", async () => {
      history.push("/a");
      let { PopStateEvent } = testWindow as Window & typeof globalThis;
      let pop = nextPop();
      testWindow.dispatchEvent(
        new PopStateEvent("popstate", { state: testWindow.history.state }),
      );
      expect(await pop).toBe(null); // was 0: a blocker would call go(0)
    });

    it("still reports the step between entries it created", async () => {
      history.push("/a");
      history.push("/b");
      let pop = nextPop();
      history.go(-2);
      expect(await pop).toBe(-2);
    });
  });
});
