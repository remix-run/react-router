import type { TestRouteObject } from "./utils/data-router-setup";
import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("scroll restoration", () => {
  afterEach(() => cleanup());

  // Version of TASK_ROUTES with no root loader to allow for initialized
  // hydrationData:null usage
  const SCROLL_ROUTES: TestRouteObject[] = [
    {
      path: "/",
      children: [
        {
          id: "index",
          index: true,
          loader: true,
        },
        {
          id: "tasks",
          path: "tasks",
          loader: true,
          action: true,
        },
        {
          path: "no-loader",
        },
      ],
    },
  ];

  describe("scroll restoration", () => {
    it("restores scroll on initial load (w/o hydrationData)", async () => {
      let t = setup({
        routes: SCROLL_ROUTES,
        initialEntries: ["/no-loader"],
      });

      expect(t.router.state.restoreScrollPosition).toBe(null);
      expect(t.router.state.preventScrollReset).toBe(false);

      // Assume initial location had a saved position
      let positions = { default: 50 };
      t.router.enableScrollRestoration(positions, () => 0);
      expect(t.router.state.restoreScrollPosition).toBe(50);
    });

    it("restores scroll on initial load (w/ hydrationData)", async () => {
      let t = setup({
        routes: SCROLL_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            index: "INDEX",
          },
        },
      });

      expect(t.router.state.restoreScrollPosition).toBe(false);
      expect(t.router.state.preventScrollReset).toBe(false);

      // Assume initial location had a saved position
      let positions = { default: 50 };
      t.router.enableScrollRestoration(positions, () => 0);
      expect(t.router.state.restoreScrollPosition).toBe(false);
    });

    it("restores scroll on navigations", async () => {
      let t = setup({
        routes: SCROLL_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            index: "INDEX_DATA",
          },
        },
      });

      expect(t.router.state.restoreScrollPosition).toBe(false);
      expect(t.router.state.preventScrollReset).toBe(false);

      let positions = {};

      // Simulate scrolling to 100 on /
      let activeScrollPosition = 100;
      t.router.enableScrollRestoration(positions, () => activeScrollPosition);

      // No restoration on first click to /tasks
      let nav1 = await t.navigate("/tasks");
      await nav1.loaders.tasks.resolve("TASKS");
      expect(t.router.state.restoreScrollPosition).toBe(null);
      expect(t.router.state.preventScrollReset).toBe(false);

      // Simulate scrolling down on /tasks
      activeScrollPosition = 200;

      // Restore on pop back to /
      let nav2 = await t.navigate(-1);
      expect(t.router.state.restoreScrollPosition).toBe(null);
      await nav2.loaders.index.resolve("INDEX");
      expect(t.router.state.restoreScrollPosition).toBe(100);
      expect(t.router.state.preventScrollReset).toBe(false);

      // Restore on pop forward to /tasks
      let nav3 = await t.navigate(1);
      await nav3.loaders.tasks.resolve("TASKS");
      expect(t.router.state.restoreScrollPosition).toBe(200);
      expect(t.router.state.preventScrollReset).toBe(false);
    });

    it("restores scroll using custom key", async () => {
      let t = setup({
        routes: SCROLL_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            index: "INDEX_DATA",
          },
        },
      });

      expect(t.router.state.restoreScrollPosition).toBe(false);
      expect(t.router.state.preventScrollReset).toBe(false);

      let positions = { "/tasks": 100 };
      let activeScrollPosition = 0;
      t.router.enableScrollRestoration(
        positions,
        () => activeScrollPosition,
        (l) => l.pathname
      );

      let nav1 = await t.navigate("/tasks");
      await nav1.loaders.tasks.resolve("TASKS");
      expect(t.router.state.restoreScrollPosition).toBe(100);
      expect(t.router.state.preventScrollReset).toBe(false);
    });

    it("does not strip the basename from the location provided to getKey", async () => {
      let t = setup({
        routes: SCROLL_ROUTES,
        basename: "/base",
        initialEntries: ["/base"],
        hydrationData: {
          loaderData: {
            index: "INDEX_DATA",
          },
        },
      });

      let positions = { "/base/tasks": 100 };
      let activeScrollPosition = 0;
      let pathname;
      t.router.enableScrollRestoration(
        positions,
        () => activeScrollPosition,
        (l) => {
          pathname = l.pathname;
          return l.pathname;
        }
      );

      let nav1 = await t.navigate("/base/tasks");
      await nav1.loaders.tasks.resolve("TASKS");
      expect(pathname).toBe("/base/tasks");
      expect(t.router.state.restoreScrollPosition).toBe(100);
      expect(t.router.state.preventScrollReset).toBe(false);
    });

    it("restores scroll on GET submissions", async () => {
      let t = setup({
        routes: SCROLL_ROUTES,
        initialEntries: ["/tasks"],
        hydrationData: {
          loaderData: {
            tasks: "TASKS",
          },
        },
      });

      expect(t.router.state.restoreScrollPosition).toBe(false);
      expect(t.router.state.preventScrollReset).toBe(false);
      // We were previously on tasks at 100
      let positions = { "/tasks": 100 };
      // But we've scrolled up to 50 to submit.  We'll save this overtop of
      // the 100 when we start this submission navigation and then restore to
      // 50 below
      let activeScrollPosition = 50;
      t.router.enableScrollRestoration(
        positions,
        () => activeScrollPosition,
        (l) => l.pathname
      );

      let nav1 = await t.navigate("/tasks", {
        formMethod: "get",
        formData: createFormData({ key: "value" }),
      });
      await nav1.loaders.tasks.resolve("TASKS2");
      expect(t.router.state.restoreScrollPosition).toBe(50);
      expect(t.router.state.preventScrollReset).toBe(false);
    });

    it("restores scroll on POST submissions", async () => {
      let t = setup({
        routes: SCROLL_ROUTES,
        initialEntries: ["/tasks"],
        hydrationData: {
          loaderData: {
            index: "INDEX_DATA",
          },
        },
      });

      expect(t.router.state.restoreScrollPosition).toBe(false);
      expect(t.router.state.preventScrollReset).toBe(false);
      // We were previously on tasks at 100
      let positions = { "/tasks": 100 };
      // But we've scrolled up to 50 to submit.  We'll save this overtop of
      // the 100 when we start this submission navigation and then restore to
      // 50 below
      let activeScrollPosition = 50;
      t.router.enableScrollRestoration(
        positions,
        () => activeScrollPosition,
        (l) => l.pathname
      );

      let nav1 = await t.navigate("/tasks", {
        formMethod: "post",
        formData: createFormData({}),
      });
      const nav2 = await nav1.actions.tasks.redirectReturn("/tasks");
      await nav2.loaders.tasks.resolve("TASKS");
      expect(t.router.state.restoreScrollPosition).toBe(50);
      expect(t.router.state.preventScrollReset).toBe(false);
    });
  });

  describe("scroll reset", () => {
    describe("default behavior", () => {
      it("resets on navigations", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks");
        await nav1.loaders.tasks.resolve("TASKS");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(false);
      });

      it("resets on navigations that redirect", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks");
        let nav2 = await nav1.loaders.tasks.redirectReturn("/");
        await nav2.loaders.index.resolve("INDEX_DATA 2");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(false);
      });

      it("does not reset on submission navigations", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks", {
          formMethod: "post",
          formData: createFormData({}),
        });
        await nav1.actions.tasks.resolve("ACTION");
        await nav1.loaders.tasks.resolve("TASKS");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(true);
      });

      it("resets on submission navigations that redirect", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks", {
          formMethod: "post",
          formData: createFormData({}),
        });
        let nav2 = await nav1.actions.tasks.redirectReturn("/");
        await nav2.loaders.index.resolve("INDEX_DATA2");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(false);
      });

      it("resets on fetch submissions that redirect", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/tasks"],
          hydrationData: {
            loaderData: {
              tasks: "TASKS",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.fetch("/tasks", {
          formMethod: "post",
          formData: createFormData({}),
        });
        let nav2 = await nav1.actions.tasks.redirectReturn("/tasks");
        await nav2.loaders.tasks.resolve("TASKS 2");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(false);
      });
    });

    describe("user-specified flag preventScrollReset flag", () => {
      it("prevents scroll reset on navigations", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks", { preventScrollReset: true });
        await nav1.loaders.tasks.resolve("TASKS");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(true);
      });

      it("prevents scroll reset on navigations that redirect", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks", { preventScrollReset: true });
        let nav2 = await nav1.loaders.tasks.redirectReturn("/");
        await nav2.loaders.index.resolve("INDEX_DATA 2");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(true);
      });

      it("prevents scroll reset on submission navigations", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks", {
          formMethod: "post",
          formData: createFormData({}),
          preventScrollReset: true,
        });
        await nav1.actions.tasks.resolve("ACTION");
        await nav1.loaders.tasks.resolve("TASKS");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(true);
      });

      it("prevents scroll reset on submission navigations that redirect", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/"],
          hydrationData: {
            loaderData: {
              index: "INDEX_DATA",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.navigate("/tasks", {
          formMethod: "post",
          formData: createFormData({}),
          preventScrollReset: true,
        });
        let nav2 = await nav1.actions.tasks.redirectReturn("/");
        await nav2.loaders.index.resolve("INDEX_DATA2");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(true);
      });

      it("prevents scroll reset on fetch submissions that redirect", async () => {
        let t = setup({
          routes: SCROLL_ROUTES,
          initialEntries: ["/tasks"],
          hydrationData: {
            loaderData: {
              tasks: "TASKS",
            },
          },
        });

        expect(t.router.state.restoreScrollPosition).toBe(false);
        expect(t.router.state.preventScrollReset).toBe(false);

        let positions = {};
        let activeScrollPosition = 0;
        t.router.enableScrollRestoration(positions, () => activeScrollPosition);

        let nav1 = await t.fetch("/tasks", {
          formMethod: "post",
          formData: createFormData({}),
          preventScrollReset: true,
        });
        let nav2 = await nav1.actions.tasks.redirectReturn("/tasks");
        await nav2.loaders.tasks.resolve("TASKS 2");
        expect(t.router.state.restoreScrollPosition).toBe(null);
        expect(t.router.state.preventScrollReset).toBe(true);
      });
    });
  });
});
