import {
  CALL_HISTORY_METHOD,
  push,
  replace,
  go,
  goBack,
  goForward
} from "../actions";

describe("routerActions", () => {
  describe("push", () => {
    it("creates actions", () => {
      expect(push("/foo")).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "push",
          args: ["/foo"]
        }
      });

      expect(push({ pathname: "/foo", state: { the: "state" } })).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "push",
          args: [
            {
              pathname: "/foo",
              state: { the: "state" }
            }
          ]
        }
      });

      expect(push("/foo", "baz", 123)).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "push",
          args: ["/foo", "baz", 123]
        }
      });
    });
  });

  describe("replace", () => {
    it("creates actions", () => {
      expect(replace("/foo")).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "replace",
          args: ["/foo"]
        }
      });

      expect(replace({ pathname: "/foo", state: { the: "state" } })).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "replace",
          args: [
            {
              pathname: "/foo",
              state: { the: "state" }
            }
          ]
        }
      });
    });
  });

  describe("go", () => {
    it("creates actions", () => {
      expect(go(1)).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "go",
          args: [1]
        }
      });
    });
  });

  describe("goBack", () => {
    it("creates actions", () => {
      expect(goBack()).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "goBack",
          args: []
        }
      });
    });
  });

  describe("goForward", () => {
    it("creates actions", () => {
      expect(goForward()).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: "goForward",
          args: []
        }
      });
    });
  });
});
