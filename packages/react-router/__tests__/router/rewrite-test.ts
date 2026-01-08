import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("rewrite", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  it("loads data from the rewrite location but updates browser URL to the to location", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    // Navigate to /images/123 but load data from /gallery?photo=123
    let A = await t.navigate("/images/123", {
      unstable_rewrite: "/gallery?photo=123",
    });

    // Should call the gallery loader, not the images loader
    expect(A.loaders.gallery).toBeDefined();
    expect(A.loaders.images).toBeUndefined();

    // The loader should receive the rewrite URL in the request
    expect(A.loaders.gallery.stub.mock.calls[0][0].request.url).toMatch(
      /\/gallery\?photo=123$/,
    );

    await A.loaders.gallery.resolve("GALLERY DATA");

    // The browser location should be /images/123, not /gallery?photo=123
    expect(t.router.state.location.pathname).toBe("/images/123");
    expect(t.router.state.location.search).toBe("");

    // The location state should contain the rewrite information
    expect(t.router.state.location.state?._rewrite).toEqual({
      pathname: "/gallery",
      search: "?photo=123",
      hash: "",
    });

    // The matched routes should be for the rewrite location
    expect(t.router.state.matches).toHaveLength(1);
    expect(t.router.state.matches[0].route.id).toBe("gallery");

    // The loader data should be present
    expect(t.router.state.loaderData.gallery).toBe("GALLERY DATA");

    t.router.dispose();
  });

  it("preserves rewrite on POP navigation", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    // Navigate to /images/123 with rewrite
    let A = await t.navigate("/images/123", {
      unstable_rewrite: "/gallery?photo=123",
    });
    await A.loaders.gallery.resolve("GALLERY DATA");

    // Navigate to home
    let B = await t.navigate("/");
    expect(t.router.state.location.pathname).toBe("/");

    // Go back - should use the rewrite
    let promise = t.router.navigate(-1);

    // Wait for navigation to complete
    await promise;

    // The browser location should be /images/123
    expect(t.router.state.location.pathname).toBe("/images/123");

    // The rewrite should still be in the state
    expect(t.router.state.location.state?._rewrite).toEqual({
      pathname: "/gallery",
      search: "?photo=123",
      hash: "",
    });

    // The matched routes should be for the rewrite location
    expect(t.router.state.matches).toHaveLength(1);
    expect(t.router.state.matches[0].route.id).toBe("gallery");

    t.router.dispose();
  });

  it("supports rewrite with replace", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/images/123", {
      unstable_rewrite: "/gallery?photo=123",
      replace: true,
    });

    expect(A.loaders.gallery).toBeDefined();
    await A.loaders.gallery.resolve("GALLERY DATA");

    expect(t.router.state.location.pathname).toBe("/images/123");
    expect(t.router.state.location.state?._rewrite).toEqual({
      pathname: "/gallery",
      search: "?photo=123",
      hash: "",
    });

    t.router.dispose();
  });

  it("supports rewrite with hash", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/images/123#preview", {
      unstable_rewrite: "/gallery?photo=123#header",
    });

    expect(A.loaders.gallery).toBeDefined();

    // The loader should receive the rewrite URL (hash is not preserved in Request URL)
    expect(A.loaders.gallery.stub.mock.calls[0][0].request.url).toMatch(
      /\/gallery\?photo=123$/,
    );

    await A.loaders.gallery.resolve("GALLERY DATA");

    // The browser location should have the "to" hash
    expect(t.router.state.location.pathname).toBe("/images/123");
    expect(t.router.state.location.hash).toBe("#preview");

    // The rewrite should have the rewrite hash
    expect(t.router.state.location.state?._rewrite).toEqual({
      pathname: "/gallery",
      search: "?photo=123",
      hash: "#header",
    });

    t.router.dispose();
  });

  it("supports rewrite with state", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/images/123", {
      unstable_rewrite: "/gallery?photo=123",
      state: { customData: "test" },
    });

    await A.loaders.gallery.resolve("GALLERY DATA");

    // Both custom state and _rewrite should be present
    expect(t.router.state.location.state).toEqual({
      customData: "test",
      _rewrite: {
        pathname: "/gallery",
        search: "?photo=123",
        hash: "",
      },
    });

    t.router.dispose();
  });

  it("supports rewrite with action submission", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", action: true, loader: true },
        { id: "images", path: "/images/:id", action: true },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/images/123", {
      unstable_rewrite: "/gallery?photo=123",
      formMethod: "post",
      formData: createFormData({ test: "value" }),
    });

    // Should call the gallery action, not the images action
    expect(A.actions.gallery).toBeDefined();
    expect(A.actions.images).toBeUndefined();

    // The action should receive the rewrite URL
    expect(A.actions.gallery.stub.mock.calls[0][0].request.url).toMatch(
      /\/gallery\?photo=123$/,
    );

    await A.actions.gallery.resolve("ACTION DATA");

    // Should then call the gallery loader
    expect(A.loaders.gallery).toBeDefined();
    await A.loaders.gallery.resolve("LOADER DATA");

    // The browser location should be /images/123
    expect(t.router.state.location.pathname).toBe("/images/123");
    expect(t.router.state.location.state?._rewrite).toEqual({
      pathname: "/gallery",
      search: "?photo=123",
      hash: "",
    });

    t.router.dispose();
  });

  it("handles rewrite with relative paths", async () => {
    let t = setup({
      routes: [
        {
          path: "/",
          children: [
            { id: "gallery", path: "gallery", loader: true },
            { id: "images", path: "images/:id", loader: true },
          ],
        },
      ],
      initialEntries: ["/"],
    });

    let A = await t.navigate("/images/123", {
      unstable_rewrite: "/gallery?photo=123",
    });

    expect(A.loaders.gallery).toBeDefined();
    await A.loaders.gallery.resolve("GALLERY DATA");

    expect(t.router.state.location.pathname).toBe("/images/123");
    expect(t.router.state.matches[1].route.id).toBe("gallery");

    t.router.dispose();
  });

  it("works without rewrite option (normal navigation)", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    // Normal navigation without rewrite
    let A = await t.navigate("/images/123");

    // Should call the images loader
    expect(A.loaders.images).toBeDefined();
    expect(A.loaders.gallery).toBeUndefined();

    await A.loaders.images.resolve("IMAGES DATA");

    expect(t.router.state.location.pathname).toBe("/images/123");
    expect(t.router.state.location.state?._rewrite).toBeUndefined();
    expect(t.router.state.matches).toHaveLength(1);
    expect(t.router.state.matches[0].route.id).toBe("images");

    t.router.dispose();
  });

  it("handles 404 on rewrite location", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    // Rewrite to a non-existent route
    let A = await t.navigate("/images/123", {
      unstable_rewrite: "/nonexistent",
    });

    // Should get a 404 error
    expect(t.router.state.errors).toBeDefined();
    expect(t.router.state.location.pathname).toBe("/images/123");

    t.router.dispose();
  });
});
