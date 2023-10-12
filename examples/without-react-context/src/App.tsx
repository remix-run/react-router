import { RouterProvider } from "react-router-dom";
import router from "./router";

export default function App() {
  return (
    <div>
      <h1>Without React Context Example</h1>
      <p>
        This example demonstrates how to make a router navigation without
        relying on React context. For example, we want to navigate to another
        page in axios interceptor, we cannot use react router hooks and
        navigation components directly because they rely on React context.
      </p>

      {/* Routes nest inside one another. Nested route paths build upon
            parent route paths, and nested route elements render inside
            parent route elements. See the note about <Outlet> below. */}
      <RouterProvider router={router} />
    </div>
  );
}
