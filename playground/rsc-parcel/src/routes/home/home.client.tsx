"use client";

import { type ClientLoaderFunctionArgs, useLoaderData } from "react-router";

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
	const res = await serverLoader<typeof import("./home").loader>();

	return {
		client: true,
		...res,
	};
}

export default function Component() {
	const { client, message } = useLoaderData<typeof clientLoader>();

	return (
		<h1>
			{message} {client}
		</h1>
	);
}
