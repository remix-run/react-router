import type { LoaderFunctionArgs } from "react-router-dom";

import { sleep } from "./routes";

export default async function loader({ request }: LoaderFunctionArgs) {
  await sleep(500);
  return {
    value: Math.round(Math.random() * 100),
  };
}
