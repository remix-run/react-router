import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  return {
    timestamp: Date.now(),
    message: "Hello from resource route!",
    echo: await request.text(),
  };
}
