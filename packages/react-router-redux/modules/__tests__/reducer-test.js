import { LOCATION_CHANGE, routerReducer } from "../reducer";

describe("routerReducer", () => {
  const state = {
    location: {
      pathname: "/foo",
      action: "POP"
    }
  };

  it("updates the path", () => {
    expect(
      routerReducer(state, {
        type: LOCATION_CHANGE,
        payload: {
          path: "/bar",
          action: "PUSH"
        }
      })
    ).toEqual({
      location: {
        path: "/bar",
        action: "PUSH"
      }
    });
  });

  it("works with initialState", () => {
    expect(
      routerReducer(undefined, {
        type: LOCATION_CHANGE,
        payload: {
          path: "/bar",
          action: "PUSH"
        }
      })
    ).toEqual({
      location: {
        path: "/bar",
        action: "PUSH"
      }
    });
  });

  it("respects replace", () => {
    expect(
      routerReducer(state, {
        type: LOCATION_CHANGE,
        payload: {
          path: "/bar",
          action: "REPLACE"
        }
      })
    ).toEqual({
      location: {
        path: "/bar",
        action: "REPLACE"
      }
    });
  });
});
