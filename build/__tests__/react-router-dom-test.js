const expected = {
  BrowserRouter: expect.any(Function),
  Link: expect.any(Function),
  // from react-router
  Router: expect.any(Function),
  Route: expect.any(Function),
  Routes: expect.any(Function),
  MemoryRouter: expect.any(Function),
  Outlet: expect.any(Function),
  useRoutes: expect.any(Function),
  useParams: expect.any(Function),
  useResolvedPath: expect.any(Function),
  useOutlet: expect.any(Function),
  useOutletContext: expect.any(Function),
};

describe("react-router-dom", () => {
  it("requires", () => {
    expect(require("react-router-dom")).toMatchObject(expected);
  });

  it("imports", () => {
    return expect(import("react-router-dom")).resolves.toMatchObject(expected);
  });
});
