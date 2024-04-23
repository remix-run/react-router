import { IDLE_NAVIGATION } from "../router";
import { cleanup, setup } from "./utils/data-router-setup";

describe("view transitions", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  it("only enables view transitions when specified for the navigation", () => {
    let t = setup({
      routes: [{ path: "/" }, { path: "/a" }, { path: "/b" }],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    // PUSH / -> /a - w/o transition
    t.navigate("/a");
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/a" }),
      }),
      expect.objectContaining({ unstable_viewTransitionOpts: undefined })
    );

    // PUSH /a -> /b - w/ transition
    t.navigate("/b", { unstable_viewTransition: true });
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/b" }),
      }),
      expect.objectContaining({
        unstable_viewTransitionOpts: {
          currentLocation: expect.objectContaining({ pathname: "/a" }),
          nextLocation: expect.objectContaining({ pathname: "/b" }),
        },
      })
    );

    // POP /b -> /a - w/ transition (cached from above)
    t.navigate(-1);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/a" }),
      }),
      expect.objectContaining({
        unstable_viewTransitionOpts: {
          // Args reversed on POP so same hooks apply
          currentLocation: expect.objectContaining({ pathname: "/a" }),
          nextLocation: expect.objectContaining({ pathname: "/b" }),
        },
      })
    );

    // POP /a -> / - No transition
    t.navigate(-1);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/" }),
      }),
      expect.objectContaining({ unstable_viewTransitionOpts: undefined })
    );

    unsubscribe();
    t.router.dispose();
  });
});
