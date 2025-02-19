import {
	createStaticHandler,
	type ActionFunction,
	type ClientActionFunction,
	type ClientLoaderFunction,
	type LinksFunction,
	type LoaderFunction,
	type Location,
	type MetaFunction,
	type Params,
	type ShouldRevalidateFunction,
	type UNSAFE_ErrorResponseImpl,
} from "react-router";
import {
	renderToReadableStream,
	// @ts-expect-error
} from "react-server-dom-parcel/server.edge";

export type RouteObject = { id: string; path?: string } & (
	| {
			index: true;
	  }
	| {
			children?: RouteObject[];
	  }
) & {
		action?: ActionFunction;
		clientAction?: ClientActionFunction;
		clientLoader?: ClientLoaderFunction;
		Component?: React.ComponentType<any>;
		ErrorBoundary?: React.ComponentType<any>;
		handle?: any;
		HydrateFallback?: React.ComponentType<any>;
		Layout?: React.ComponentType<any>;
		links?: LinksFunction;
		loader?: LoaderFunction;
		meta?: MetaFunction;
		shouldRevalidate?: ShouldRevalidateFunction;
	};

export type RouteMatch = {
	clientAction?: ClientActionFunction;
	clientLoader?: ClientLoaderFunction;
	Component?: React.ComponentType;
	ErrorBoundary?: React.ComponentType;
	handle?: any;
	hasAction: boolean;
	hasLoader: boolean;
	HydrateFallback?: React.ComponentType;
	id: string;
	index?: boolean;
	Layout?: React.ComponentType;
	links?: LinksFunction;
	meta?: MetaFunction;
	params: Params;
	path?: string;
	pathname: string;
	pathnameBase: string;
	shouldRevalidate?: ShouldRevalidateFunction;
};

export type ServerPayload = {
	actionData: Record<string, any> | null;
	basename?: string;
	deepestRenderedBoundaryId?: string;
	errors: Record<string, any> | null;
	loaderData: Record<string, any>;
	location: Location;
	matches: RouteMatch[];
	nonce?: string;
};

export async function handleRequest(request: Request, routes: RouteObject[]) {
	const handler = createStaticHandler(routes);
	const result = await handler.query(request);

	if (result instanceof Response) {
		const headers = new Headers(result.headers);
		headers.set("Vary", "Content-Type");
		headers.set("x-react-router-error", "true");
		return result;
	}

	const errors = result.errors
		? Object.fromEntries(
				Object.entries(result.errors).map(([key, error]) => [
					key,
					isRouteErrorResponse(error)
						? Object.fromEntries(Object.entries(error))
						: error,
				]),
			)
		: result.errors;

	const payload: ServerPayload = {
		actionData: result.actionData,
		deepestRenderedBoundaryId: result._deepestRenderedBoundaryId ?? undefined,
		errors,
		loaderData: result.loaderData,
		location: result.location,
		matches: result.matches.map((match) => ({
			clientAction: (match.route as any).clientAction,
			clientLoader: (match.route as any).clientLoader,
			Component: (match.route as any).default,
			ErrorBoundary: (match.route as any).ErrorBoundary,
			handle: (match.route as any).handle,
			hasAction: !!match.route.action,
			hasLoader: !!match.route.loader,
			HydrateFallback: (match.route as any).HydrateFallback,
			id: match.route.id,
			index: match.route.index,
			Layout: (match.route as any).Layout,
			links: (match.route as any).links,
			meta: (match.route as any).meta,
			params: match.params,
			path: match.route.path,
			pathname: match.pathname,
			pathnameBase: match.pathnameBase,
			shouldRevalidate: (match.route as any).shouldRevalidate,
		})),
	};

	const body = renderToReadableStream(payload);

	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": "text/x-component",
			Vary: "Content-Type",
		},
	});
}

function isRouteErrorResponse(error: any): error is UNSAFE_ErrorResponseImpl {
	return (
		error != null &&
		typeof error.status === "number" &&
		typeof error.statusText === "string" &&
		typeof error.internal === "boolean" &&
		"data" in error
	);
}
