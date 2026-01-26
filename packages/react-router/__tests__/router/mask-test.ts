import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("rewrite", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  it("navigates to router location and masks the browser URL", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    // Navigate to /gallery?photo=123 but mask browser URL as /images/123
    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
    });

    // Should call the gallery loader, not the images loader
    expect(A.loaders.gallery).toBeDefined();
    expect(A.loaders.images).toBeUndefined();

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
    expect(t.router.state.matches).toHaveLength(1);
    expect(t.router.state.matches[0].route.id).toBe("gallery");

    // The loader data should be present
    expect(t.router.state.loaderData.gallery).toBe("GALLERY DATA");

    t.router.dispose();
  });

  it("preserves mask on POP navigation", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    // Navigate to /gallery?photo=123 with mask
    let A = await t.navigate("/gallery?photo=123", {
      unstable_mask: "/images/123",
    });
    await A.loaders.gallery.resolve("GALLERY DATA");

    // Navigate to home
    let B = await t.navigate("/");
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

    // The matched routes should be for the router location
    expect(t.router.state.matches).toHaveLength(1);
    expect(t.router.state.matches[0].route.id).toBe("gallery");

    t.router.dispose();
  });

  it("supports mask with replace", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
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

    t.router.dispose();
  });

  it("supports mask with hash", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
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

    t.router.dispose();
  });

  it("supports mask with state", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", loader: true },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
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

    t.router.dispose();
  });

  it("supports mask with action submission", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "gallery", path: "/gallery", action: true, loader: true },
        { id: "images", path: "/images/:id", action: true },
      ],
      initialEntries: ["/"],
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

    t.router.dispose();
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
      initialEntries: ["/"],
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

    // Normal navigation without mask
    let A = await t.navigate("/images/123");

    // Should call the images loader
    expect(A.loaders.images).toBeDefined();
    expect(A.loaders.gallery).toBeUndefined();

    await A.loaders.images.resolve("IMAGES DATA");

    expect(t.router.state.location).toMatchObject({
      pathname: "/images/123",
      unstable_mask: undefined,
    });
    expect(t.router.state.matches).toHaveLength(1);
    expect(t.router.state.matches[0].route.id).toBe("images");

    t.router.dispose();
  });

  it("handles 404 on router location", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "images", path: "/images/:id", loader: true },
      ],
      initialEntries: ["/"],
    });

    // Navigate to non-existent route with mask
    let A = await t.navigate("/nonexistent", {
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

    t.router.dispose();
  });
});
