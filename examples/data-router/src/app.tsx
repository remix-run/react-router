import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import {
  Fallback,
  Layout,
  homeLoader,
  Home,
  deferredLoader,
  DeferredPage,
  deferredChildLoader,
  deferredChildAction,
  DeferredChild,
  todosAction,
  todosLoader,
  TodosList,
  TodosBoundary,
  todoLoader,
  Todo,
  sleep,
  AwaitPage,
} from "./routes";
import "./index.css";

let router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index loader={homeLoader} element={<Home />} />
      <Route path="deferred" loader={deferredLoader} element={<DeferredPage />}>
        <Route
          path="child"
          loader={deferredChildLoader}
          action={deferredChildAction}
          element={<DeferredChild />}
        />
      </Route>
      <Route id="await" path="await" element={<AwaitPage />} />
      <Route
        path="long-load"
        loader={() => sleep(3000)}
        element={<h1>👋</h1>}
      />
      <Route
        path="todos"
        action={todosAction}
        loader={todosLoader}
        element={<TodosList />}
        errorElement={<TodosBoundary />}
      >
        <Route path=":id" loader={todoLoader} element={<Todo />} />
      </Route>
    </Route>
  )
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => router.dispose());
}

export default function App() {
  return <RouterProvider router={router} fallbackElement={<Fallback />} />;
}
