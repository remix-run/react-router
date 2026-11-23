/* eslint-disable jest/expect-expect */

import {
  type BrowserHistory,
  type Location,
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

  describe("falsy state", () => {
    it("preserves falsy state values across push, replace, and POP", async () => {
      history.push("/a", false);
      expect(history.location.state).toBe(false);

      history.push("/b", 0);
      expect(history.location.state).toBe(0);

      history.push("/c", "");
      expect(history.location.state).toBe("");

      history.replace("/d", NaN);
      expect(history.location.state).toBeNaN();

      let pop = () =>
        new Promise<Location>((resolve) => {
          let unlisten = history.listen(({ location }) => {
            unlisten();
            resolve(location);
          });
        });

      let backToB = pop();
      history.go(-1);
      expect((await backToB).state).toBe(0);
      expect(history.location.state).toBe(0);

      let backToA = pop();
      history.go(-1);
      expect((await backToA).state).toBe(false);
      expect(history.location.state).toBe(false);

      let forwardToB = pop();
      history.go(1);
      expect((await forwardToB).state).toBe(0);
      expect(history.location.state).toBe(0);
    });

    it("preserves falsy initial history state and defaults nullish or non-object state to null", () => {
      for (let state of [false, 0, ""]) {
        let win = getWindow("/saved");
        win.history.replaceState(
          { usr: state, key: "k", idx: 0 },
          "",
          "/saved",
        );
        let reloaded = createBrowserHistory({ window: win });
        expect(reloaded.location.state).toBe(state);
      }

      for (let rawState of [
        null,
        { usr: undefined, key: "k", idx: 0 },
        { usr: null, key: "k", idx: 0 },
        false,
        0,
        "",
      ]) {
        testWindow.history.replaceState(rawState, "", "/external");
        expect(history.location.state).toBeNull();
      }
    });
  });
});
