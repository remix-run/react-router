import React from "react";
import type { ActionFunction, LoaderFunction } from "react-router-dom";
import {
  DataBrowserRouter,
  Form,
  Link,
  Route,
  Outlet,
  useFetcher,
  useFetchers,
  useLoaderData,
  useNavigation,
  useParams,
  useRouteError,
} from "react-router-dom";

import type { Todos } from "./todos";
import { addTodo, deleteTodo, getTodos } from "./todos";

let sleep = () => new Promise((r) => setTimeout(r, 500));

function Fallback() {
  return <p>Performing initial data "load"</p>;
}

// Layout
function Layout() {
  let navigation = useNavigation();
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
        <Link to="/404">404 Link</Link>
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

function App() {
  return (
    <DataBrowserRouter fallbackElement={<Fallback />}>
      <Route path="/" element={<Layout />}>
        <Route index loader={homeLoader} element={<Home />} />
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
