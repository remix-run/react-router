import { Form, useNavigation } from "react-router";
import type { Route } from "./+types/product";
import { useTransition } from "react";

export async function loader({ params }: Route.LoaderArgs) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { name: `Super cool product #${params.id}` };
}

export async function action() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Action complete!";
}

export default function Component({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const [pending, setPending] = useTransition();
  return (
    <>
      <h1>{loaderData.name}</h1>
      <p>{pending ? "Loading..." : "Idle"}</p>
      <Form
        onSubmit={() => {
          setPending(() => {});
        }}
      >
        <button type="submit">Perform Action</button>
      </Form>
      {actionData && <p>{actionData}</p>}
    </>
  );
}
