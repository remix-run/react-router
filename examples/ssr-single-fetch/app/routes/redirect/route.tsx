import { redirect } from "react-router-dom";

import { sleep } from "../utils.js";

export async function loader() {
  await sleep();
  return redirect("/");
}
