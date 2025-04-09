export { clientLoader, default } from "./about.client";

export function loader() {
  throw new Error("Oops");
  return {
    message: "Hello About!",
  };
}
