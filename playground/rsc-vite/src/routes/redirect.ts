import { redirect, redirectDocument, replace } from "react-router/server";

export function loader() {
  throw redirectDocument("/about?redirected");
}
