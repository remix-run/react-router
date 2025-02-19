export { default, ErrorBoundary, Layout } from "./root.client";

export function loader() {
	return {
		message: "Hello from the server!",
	};
}
