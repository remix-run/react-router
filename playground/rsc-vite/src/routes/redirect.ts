import { redirectDocument } from "react-router/rsc";

export function loader() {
  throw redirectDocument("/about?redirected");
}
