import { redirectDocument } from "react-router";

export function loader() {
  throw redirectDocument("/about?redirected");
}
