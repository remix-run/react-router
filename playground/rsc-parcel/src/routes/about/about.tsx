export { clientLoader, default } from "./about.client";

export function loader() {
  return {
    message: "Hello About!",
  };
}
