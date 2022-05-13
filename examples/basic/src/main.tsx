import "./index.css";
import React from "react";
import ReactDOM from "react-dom";
import {
  DataBrowserRouter,
  Route,
  useLoaderData,
  Form,
  useNavigation,
} from "react-router-dom";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function getTasks() {
  await sleep(Math.random() * 500);
  let json = localStorage.getItem("tasks");
  return json ? JSON.parse(json) : [];
}

async function setTasks(tasks: string[]) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

async function addTask(task: string) {
  await sleep(Math.random() * 500);
  let tasks = (await getTasks()) as unknown as string[];
  tasks.push(task);
  await setTasks(tasks);
  return task;
}

ReactDOM.render(
  <React.StrictMode>
    <DataBrowserRouter fallbackElement={<div>Loading...</div>}>
      <Route
        path="/"
        loader={async () => getTasks()}
        action={async ({ request }) => {
          let formData = await request.formData();
          let text = formData.get("text") as string;
          return addTask(text);
        }}
        element={<Tasks />}
      />
    </DataBrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

function Tasks() {
  let data = useLoaderData();
  let ref = React.useRef<HTMLInputElement>(null);
  let navigation = useNavigation();
  let busy =
    navigation.state === "submitting" || navigation.state === "loading";

  React.useEffect(() => {
    if (!busy) {
      ref.current?.select();
    }
  }, [busy]);

  return (
    <div>
      {data.map((task: string, i: number) => (
        <div key={i}>{task}</div>
      ))}
      <Form method="post">
        <fieldset disabled={busy}>
          <input ref={ref} name="text" placeholder="New Task" />{" "}
          <button type="submit">{busy ? "Adding..." : "Add"}</button>
        </fieldset>
      </Form>
    </div>
  );
}
