import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import React, { useCallback } from "react";

// Child1 updates the search params
const Child1 = () => {
  const [params, setSearchParams] = useSearchParams();
  
  const handleClick = () => {
    setSearchParams({ name: "John" }); // Properly set the search param as an object
  };
  
  console.log("child1 rendered");
  return <button onClick={handleClick}>Child1</button>;
};

// Child2 uses useNavigate but doesn't depend on search params
const Child2 = React.memo(() => {
  const navigate = useNavigate(); // Keep this here if navigation is actually needed
  
  const handleNavigation = useCallback(() => {
    navigate("/some-route");
  }, [navigate]); // Memoize this to avoid function recreation

  console.log("child2 rendered");

  return (
    <button onClick={handleNavigation}>
      Child2
    </button>
  );
});

const Home = () => {
  return (
    <div>
      <Child1 />
      <Child2 />
    </div>
  );
};

const routes = [
  {
    path: "/",
    element: <Home />,
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
