import { redirect, redirectDocument, replace } from "react-router/rsc";

export function loader() {
  throw redirectDocument("/about?redirected");
}
