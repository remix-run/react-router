import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout, Home, About, Dashboard, NoMatch } from "./pages";

const routes = createRoutesFromElements(
  <>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
      <Route path="dashboard" element={<Dashboard />} />

      {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
      <Route path="*" element={<NoMatch />} />
    </Route>
  </>
);

/**
 * @see https://github.com/remix-run/react-router/discussions/9915
 */
const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routes);

export default router;
