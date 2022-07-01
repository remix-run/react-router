import React from "react";
import {
  type ActionFunction,
  type Deferrable,
  type LoaderFunction,
  DataBrowserRouter,
  Deferred,
  Form,
  Link,
  Route,
  Outlet,
  deferred,
  useDeferredData,
  useFetcher,
  useFetchers,
  useLoaderData,
  useNavigation,
  useParams,
  useRevalidator,
  useRouteError,
  json,
  useActionData,
} from "react-router-dom";

import type { Todos } from "./todos";
import { addTodo, deleteTodo, getTodos } from "./todos";

let sleep = (n: number = 500) => new Promise((r) => setTimeout(r, n));

function Fallback() {
  return <p>Performing initial data "load"</p>;
}

// Layout
function Layout() {
  let navigation = useNavigation();
  let { revalidate } = useRevalidator();
  let fetchers = useFetchers();
  let fetcherInProgress = fetchers.some((f) =>
    ["loading", "submitting"].includes(f.state)
  );
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        &nbsp;|&nbsp;
        <Link to="/todos">Todos</Link>
        &nbsp;|&nbsp;
        <Link to="/deferred">Deferred</Link>
        &nbsp;|&nbsp;
        <Link to="/deferred/child">Deferred Child</Link>
        &nbsp;|&nbsp;
        <Link to="/long-load">Long Load</Link>
        &nbsp;|&nbsp;
        <Link to="/404">404 Link</Link>
        &nbsp;&nbsp;
        <button onClick={() => revalidate()}>Revalidate</button>
      </nav>
      <div style={{ position: "fixed", top: 0, right: 0 }}>
        {navigation.state !== "idle" && <p>Navigation in progress...</p>}
        {fetcherInProgress && <p>Fetcher in progress...</p>}
      </div>
      <p>
        Click on over to <Link to="/todos">/todos</Link> and check out these
        data loading APIs!{" "}
      </p>
      <p>
        Or, checkout <Link to="/deferred">/deferred</Link> to see how to
        separate critical and lazily loaded data in your loaders.
      </p>
      <p>
        We've introduced some fake async-aspects of routing here, so Keep an eye
        on the top-right hand corner to see when we're actively navigating.
      </p>
      <Outlet />
    </>
  );
}

// Home
const homeLoader: LoaderFunction = async () => {
  await sleep();
  return {
    date: new Date().toISOString(),
  };
};

function Home() {
  let data = useLoaderData();
  return (
    <>
      <h2>Home</h2>
      <p>Last loaded at: {data.date}</p>
    </>
  );
}

// Todos
const todosAction: ActionFunction = async ({ request }) => {
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
};

const todosLoader: LoaderFunction = async () => {
  await sleep();
  return getTodos();
};

function TodosList() {
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

function TodosBoundary() {
  let error = useRouteError();
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

function TodoItem({ id, todo }: TodoItemProps) {
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
const todoLoader: LoaderFunction = async ({ params }) => {
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
};

function Todo() {
  let params = useParams();
  let todo = useLoaderData();
  return (
    <>
      <h2>Nested Todo Route:</h2>
      <p>id: {params.id}</p>
      <p>todo: {todo}</p>
    </>
  );
}

interface DeferredRouteLoaderData {
  critical1: string;
  critical2: string;
  lazyResolved: Deferrable<string>;
  lazy1: Deferrable<string>;
  lazy2: Deferrable<string>;
  lazy3: Deferrable<string>;
  lazyError: Deferrable<string>;
}

const rand = () => Math.round(Math.random() * 100);
const resolve = (d: string, ms: number) =>
  new Promise((r) => setTimeout(() => r(`${d} - ${rand()}`), ms));
const reject = (d: string, ms: number) =>
  new Promise((_, r) => setTimeout(() => r(`${d} - ${rand()}`), ms));

const deferredLoader: LoaderFunction = async ({ request }) => {
  return deferred({
    critical1: await resolve("Critical 1", 250),
    critical2: await resolve("Critical 2", 500),
    lazyResolved: Promise.resolve("Lazy Data immediately resolved - " + rand()),
    lazy1: resolve("Lazy 1", 1000),
    lazy2: resolve("Lazy 2", 1500),
    lazy3: resolve("Lazy 3", 2000),
    lazyError: reject("Kaboom!", 2500),
  });
};

function DeferredPage() {
  let data = useLoaderData() as DeferredRouteLoaderData;

  return (
    <div>
      <p>{data.critical1}</p>
      <p>{data.critical2}</p>
      <Deferred value={data.lazyResolved} fallback={<p>should not see me!</p>}>
        <RenderDeferredData />
      </Deferred>
      <Deferred value={data.lazy1} fallback={<p>loading 1...</p>}>
        <RenderDeferredData />
      </Deferred>
      <Deferred value={data.lazy2} fallback={<p>loading 2...</p>}>
        <RenderDeferredData />
      </Deferred>
      <Deferred value={data.lazy3} fallback={<p>loading 3...</p>}>
        {(data) => <p>{data}</p>}
      </Deferred>
      <Deferred
        value={data.lazyError}
        fallback={<p>loading (error)...</p>}
        errorElement={<RenderDeferredError />}
      >
        <RenderDeferredData />
      </Deferred>
      <Outlet />
    </div>
  );
}

const deferredChildLoader: LoaderFunction = async ({ request }) => {
  return deferred({
    critical: await resolve("Critical Child Data", 500),
    lazy: resolve("Lazy Child Data", 1000),
  });
};

const deferredChildAction: ActionFunction = async ({ request }) => {
  return json({ ok: true });
};

function DeferredChild() {
  let data = useLoaderData();
  let actionData = useActionData();
  return (
    <div>
      <p>{data.critical}</p>
      <Deferred value={data.lazy} fallback={<p>loading child...</p>}>
        <RenderDeferredData />
      </Deferred>
      <Form method="post">
        <button type="submit" name="key" value="value">
          Submit
        </button>
      </Form>
      {actionData ? <p>Action data:{JSON.stringify(actionData)}</p> : null}
    </div>
  );
}

function RenderDeferredData() {
  let data = useDeferredData<string>();
  return <p>{data}</p>;
}

function RenderDeferredError() {
  let error = useRouteError();
  return (
    <p style={{ color: "red" }}>
      Error (errorElement)!
      <br />
      {error.message} {error.stack}
    </p>
  );
}

function App() {
  return (
    <DataBrowserRouter fallbackElement={<Fallback />}>
      <Route path="/" element={<Layout />}>
        <Route index loader={homeLoader} element={<Home />} />
        <Route
          path="deferred"
          loader={deferredLoader}
          element={<DeferredPage />}
        >
          <Route
            path="child"
            loader={deferredChildLoader}
            action={deferredChildAction}
            element={<DeferredChild />}
          />
        </Route>
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
    </DataBrowserRouter>
  );
}

export default App;
