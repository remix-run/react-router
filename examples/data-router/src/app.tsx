import * as React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import {
  Await,
  createBrowserRouter,
  defer,
  Form,
  Link,
  Outlet,
  RouterProvider,
  useAsyncError,
  useAsyncValue,
  useFetcher,
  useFetchers,
  useLoaderData,
  useNavigation,
  useParams,
  useRevalidator,
  useRouteError,
} from "react-router-dom";

import type { Todos } from "./todos";
import { addTodo, deleteTodo, getTodos } from "./todos";

import "./index.css";

let router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        loader: homeLoader,
        Component: Home,
      },
      {
        path: "todos",
        action: todosAction,
        loader: todosLoader,
        Component: TodosList,
        ErrorBoundary: TodosBoundary,
        children: [
          {
            path: ":id",
            loader: todoLoader,
            Component: Todo,
          },
        ],
      },
      {
        path: "deferred",
        loader: deferredLoader,
        Component: DeferredPage,
      },
    ],
  },
]);

if (import.meta.hot) {
  import.meta.hot.dispose(() => router.dispose());
}

export default function App() {
  return <RouterProvider router={router} fallbackElement={<Fallback />} />;
}

export function sleep(n: number = 500) {
  return new Promise((r) => setTimeout(r, n));
}

export function Fallback() {
  return <p>Performing initial data load</p>;
}

// Layout
export function Layout() {
  let navigation = useNavigation();
  let revalidator = useRevalidator();
  let fetchers = useFetchers();
  let fetcherInProgress = fetchers.some((f) =>
    ["loading", "submitting"].includes(f.state)
  );

  return (
    <>
      <h1>Data Router Example</h1>

      <p>
        This example demonstrates some of the core features of React Router
        including nested &lt;Route&gt;s, &lt;Outlet&gt;s, &lt;Link&gt;s, and
        using a "*" route (aka "splat route") to render a "not found" page when
        someone visits an unrecognized URL.
      </p>

      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/todos">Todos</Link>
          </li>
          <li>
            <Link to="/deferred">Deferred</Link>
          </li>
          <li>
            <Link to="/404">404 Link</Link>
          </li>
          <li>
            <button onClick={() => revalidator.revalidate()}>
              Revalidate Data
            </button>
          </li>
        </ul>
      </nav>
      <div style={{ position: "fixed", top: 0, right: 0 }}>
        {navigation.state !== "idle" && <p>Navigation in progress...</p>}
        {revalidator.state !== "idle" && <p>Revalidation in progress...</p>}
        {fetcherInProgress && <p>Fetcher in progress...</p>}
      </div>
      <p>
        Click on over to <Link to="/todos">/todos</Link> and check out these
        data loading APIs!
      </p>
      <p>
        Or, checkout <Link to="/deferred">/deferred</Link> to see how to
        separate critical and lazily loaded data in your loaders.
      </p>
      <p>
        We've introduced some fake async-aspects of routing here, so Keep an eye
        on the top-right hand corner to see when we're actively navigating.
      </p>
      <hr />
      <Outlet />
    </>
  );
}

// Home
interface HomeLoaderData {
  date: string;
}

export async function homeLoader(): Promise<HomeLoaderData> {
  await sleep();
  return {
    date: new Date().toISOString(),
  };
}

export function Home() {
  let data = useLoaderData() as HomeLoaderData;
  return (
    <>
      <h2>Home</h2>
      <p>Date from loader: {data.date}</p>
    </>
  );
}

// Todos
export async function todosAction({ request }: ActionFunctionArgs) {
  await sleep();

  let formData = await request.formData();

  // Deletion via fetcher
  if (formData.get("action") === "delete") {
    let id = formData.get("todoId");
    if (typeof id === "string") {
      deleteTodo(id);
      return { ok: true };
    }
  }

  // Addition via <Form>
  let todo = formData.get("todo");
  if (typeof todo === "string") {
    addTodo(todo);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: "/todos" },
  });
}

export async function todosLoader(): Promise<Todos> {
  await sleep();
  return getTodos();
}

export function TodosList() {
  let todos = useLoaderData() as Todos;
  let navigation = useNavigation();
  let formRef = React.useRef<HTMLFormElement>(null);

  // If we add and then we delete - this will keep isAdding=true until the
  // fetcher completes it's revalidation
  let [isAdding, setIsAdding] = React.useState(false);
  React.useEffect(() => {
    if (navigation.formData?.get("action") === "add") {
      setIsAdding(true);
    } else if (navigation.state === "idle") {
      setIsAdding(false);
      formRef.current?.reset();
    }
  }, [navigation]);

  return (
    <>
      <h2>Todos</h2>
      <p>
        This todo app uses a &lt;Form&gt; to submit new todos and a
        &lt;fetcher.form&gt; to delete todos. Click on a todo item to navigate
        to the /todos/:id route.
      </p>
      <ul>
        <li>
          <Link to="/todos/junk">
            Click this link to force an error in the loader
          </Link>
        </li>
        {Object.entries(todos).map(([id, todo]) => (
          <li key={id}>
            <TodoItem id={id} todo={todo} />
          </li>
        ))}
      </ul>
      <Form method="post" ref={formRef}>
        <input type="hidden" name="action" value="add" />
        <input name="todo"></input>
        <button type="submit" disabled={isAdding}>
          {isAdding ? "Adding..." : "Add"}
        </button>
      </Form>
      <Outlet />
    </>
  );
}

export function TodosBoundary() {
  let error = useRouteError() as Error;
  return (
    <>
      <h2>Error 💥</h2>
      <p>{error.message}</p>
    </>
  );
}

interface TodoItemProps {
  id: string;
  todo: string;
}

export function TodoItem({ id, todo }: TodoItemProps) {
  let fetcher = useFetcher();

  let isDeleting = fetcher.formData != null;
  return (
    <>
      <Link to={`/todos/${id}`}>{todo}</Link>
      &nbsp;
      <fetcher.Form method="post" style={{ display: "inline" }}>
        <input type="hidden" name="action" value="delete" />
        <button type="submit" name="todoId" value={id} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </fetcher.Form>
    </>
  );
}

// Todo
export async function todoLoader({
  params,
}: LoaderFunctionArgs): Promise<string> {
  await sleep();
  let todos = getTodos();
  if (!params.id) {
    throw new Error("Expected params.id");
  }
  let todo = todos[params.id];
  if (!todo) {
    throw new Error(`Uh oh, I couldn't find a todo with id "${params.id}"`);
  }
  return todo;
}

export function Todo() {
  let params = useParams();
  let todo = useLoaderData() as string;
  return (
    <>
      <h2>Nested Todo Route:</h2>
      <p>id: {params.id}</p>
      <p>todo: {todo}</p>
    </>
  );
}

// Deferred Data
interface DeferredRouteLoaderData {
  critical1: string;
  critical2: string;
  lazyResolved: Promise<string>;
  lazy1: Promise<string>;
  lazy2: Promise<string>;
  lazy3: Promise<string>;
  lazyError: Promise<string>;
}

const rand = () => Math.round(Math.random() * 100);
const resolve = (d: string, ms: number) =>
  new Promise((r) => setTimeout(() => r(`${d} - ${rand()}`), ms));
const reject = (d: Error | string, ms: number) =>
  new Promise((_, r) =>
    setTimeout(() => {
      if (d instanceof Error) {
        d.message += ` - ${rand()}`;
      } else {
        d += ` - ${rand()}`;
      }
      r(d);
    }, ms)
  );

export async function deferredLoader() {
  return defer({
    critical1: await resolve("Critical 1", 250),
    critical2: await resolve("Critical 2", 500),
    lazyResolved: Promise.resolve("Lazy Data immediately resolved - " + rand()),
    lazy1: resolve("Lazy 1", 1000),
    lazy2: resolve("Lazy 2", 1500),
    lazy3: resolve("Lazy 3", 2000),
    lazyError: reject(new Error("Kaboom!"), 2500),
  });
}

export function DeferredPage() {
  let data = useLoaderData() as DeferredRouteLoaderData;
  return (
    <div>
      {/* Critical data renders immediately */}
      <p>{data.critical1}</p>
      <p>{data.critical2}</p>

      {/* Pre-resolved deferred data never triggers the fallback */}
      <React.Suspense fallback={<p>should not see me!</p>}>
        <Await resolve={data.lazyResolved}>
          <RenderAwaitedData />
        </Await>
      </React.Suspense>

      {/* Deferred data can be rendered using a component + the useAsyncValue() hook */}
      <React.Suspense fallback={<p>loading 1...</p>}>
        <Await resolve={data.lazy1}>
          <RenderAwaitedData />
        </Await>
      </React.Suspense>

      <React.Suspense fallback={<p>loading 2...</p>}>
        <Await resolve={data.lazy2}>
          <RenderAwaitedData />
        </Await>
      </React.Suspense>

      {/* Or you can bypass the hook and use a render function */}
      <React.Suspense fallback={<p>loading 3...</p>}>
        <Await resolve={data.lazy3}>{(data: string) => <p>{data}</p>}</Await>
      </React.Suspense>

      {/* Deferred rejections render using the useAsyncError hook */}
      <React.Suspense fallback={<p>loading (error)...</p>}>
        <Await resolve={data.lazyError} errorElement={<RenderAwaitedError />}>
          <RenderAwaitedData />
        </Await>
      </React.Suspense>
    </div>
  );
}

function RenderAwaitedData() {
  let data = useAsyncValue() as string;
  return <p>{data}</p>;
}

function RenderAwaitedError() {
  let error = useAsyncError() as Error;
  return (
    <p style={{ color: "red" }}>
      Error (errorElement)!
      <br />
      {error.message} {error.stack}
    </p>
  );
}
