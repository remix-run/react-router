"use server-entry";

import "./browser";

import type { RouteObject } from "./react-router.server";

import * as home from "./routes/home/home";
import * as root from "./routes/root/root";

export function routes(): RouteObject[] {
	return [
		{
			id: "root",
			...root,
			children: [
				{
					id: "home",
					index: true,
					...home,
				},
			],
		},
	];
}
