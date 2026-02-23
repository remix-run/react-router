import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("location masking", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  it("navigates to router location and masks the browser URL", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
    });

    // Navigate to /gallery?photo=123 but mask browser URL as /images/123
    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
    });

    // The loader should receive the router location URL in the request
    expect(A.loaders.gallery.stub.mock.calls[0][0].request.url).toMatch(
      /\/gallery\?photo=123$/,
    );

    await A.loaders.gallery.resolve("GALLERY DATA");

    expect(t.router.state.location).toMatchObject({
      pathname: "/gallery",
      search: "?photo=123",
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "",
      },
    });

    // The matched routes should be for the router location
    expect(t.router.state.matches.map((m) => m.route.id)).toEqual(["gallery"]);

    // The loader data should be present
    expect(t.router.state.loaderData.gallery).toBe("GALLERY DATA");
  });

  it("preserves mask on POP navigation", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
    });

    // Navigate to /gallery?photo=123 with mask
    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
    });
    await A.loaders.gallery.resolve("GALLERY DATA");

    // Navigate to home
    await t.navigate("/");
    expect(t.router.state.location.pathname).toBe("/");

    // Go back - should preserve the mask
    let promise = t.router.navigate(-1);

    // Wait for navigation to complete
    await promise;

    expect(t.router.state.location).toMatchObject({
      pathname: "/gallery",
      search: "?photo=123",
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "",
      },
    });

    expect(t.router.state.matches.map((m) => m.route.id)).toEqual(["gallery"]);
  });

  it("supports mask with replace", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
    });

    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
      replace: true,
    });

    expect(A.loaders.gallery).toBeDefined();
    await A.loaders.gallery.resolve("GALLERY DATA");

    expect(t.router.state.location).toMatchObject({
      pathname: "/gallery",
      search: "?photo=123",
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "",
      },
    });
  });

  it("supports mask with hash", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
    });

    let A = await t.navigate("/gallery?photo=123#header", {
      unstable_mask: "/images/123#preview",
    });

    expect(A.loaders.gallery).toBeDefined();

    // The loader should receive the router location URL (hash is not preserved in Request URL)
    expect(A.loaders.gallery.stub.mock.calls[0][0].request.url).toMatch(
      /\/gallery\?photo=123$/,
    );

    await A.loaders.gallery.resolve("GALLERY DATA");

    expect(t.router.state.location).toMatchObject({
      pathname: "/gallery",
      search: "?photo=123",
      hash: "#header",
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "#preview",
      },
    });
  });

  it("supports mask with state", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
    });

    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
      state: { customData: "test" },
    });

    await A.loaders.gallery.resolve("GALLERY DATA");

    expect(t.router.state.location).toMatchObject({
      pathname: "/gallery",
      search: "?photo=123",
      state: { customData: "test" },
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "",
      },
    });
  });

  it("supports mask with action submission", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", action: true, loader: true },
        { id: "images", path: "/images/:id", action: true },
      ],
    });

    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
      formMethod: "post",
      formData: createFormData({ test: "value" }),
    });

    // Should call the gallery action, not the images action
    expect(A.actions.gallery).toBeDefined();
    expect(A.actions.images).toBeUndefined();

    // The action should receive the router location URL
    expect(A.actions.gallery.stub.mock.calls[0][0].request.url).toMatch(
      /\/gallery\?photo=123$/,
    );

    await A.actions.gallery.resolve("ACTION DATA");

    // Should then call the gallery loader
    expect(A.loaders.gallery).toBeDefined();
    await A.loaders.gallery.resolve("LOADER DATA");

    expect(t.router.state.location).toMatchObject({
      pathname: "/gallery",
      search: "?photo=123",
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "",
      },
    });
  });

  it("handles mask with relative paths", async () => {
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
    });

    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
    });

    expect(A.loaders.gallery).toBeDefined();
    await A.loaders.gallery.resolve("GALLERY DATA");

    expect(t.router.state.location).toMatchObject({
      pathname: "/gallery",
      search: "?photo=123",
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "",
      },
    });
    expect(t.router.state.matches.map((m) => m.route.id)).toEqual([
      "route-0",
      "gallery",
    ]);
  });

  it("handles 404 on router location", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "images", path: "/images/:id", loader: true },
      ],
    });

    // Navigate to non-existent route with mask
    await t.navigate("/nonexistent", {
      unstable_mask: "/images/123",
    });

    // Should get a 404 error
    expect(t.router.state.errors).toBeDefined();
    expect(t.router.state.location).toMatchObject({
      pathname: "/nonexistent",
      unstable_mask: {
        pathname: "/images/123",
        search: "",
        hash: "",
      },
    });
  });
});
