"use client";

import { useTransition } from "react";
import {
  useRouteError,
  useNavigation,
  isRouteErrorResponse,
  useNavigate,
} from "react-router";

export function ErrorReporter() {
  const error = useRouteError();

  if (typeof document !== "undefined") {
    console.log(error);
  }

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <p>Error Response</p>
        <p>Status: {error.status}</p>
        <p>Data: {JSON.stringify(error.data)}</p>
      </div>
    );
  }

  return (
    <div>
      <p>Error</p>
      <p>{error instanceof Error ? error.message : String(error)}</p>
    </div>
  );
}

export function NavigationState() {
  let navigation = useNavigation();
  let navigate = useNavigate();
  let [pending, startTransition] = useTransition();
  return (
    <>
      <p>Navigation state: {navigation.state}</p>
      <p>Pending: {pending ? "Yes" : "No"}</p>
      <p>
        <button onClick={() => startTransition(() => navigate("/"))}>
          Go Home
        </button>
      </p>
      <p>
        <button onClick={() => startTransition(() => navigate("/parent"))}>
          Go Parent
        </button>
      </p>
    </>
  );
}

export function ErrorBoundary() {
  return (
    <>
      <p>Something went wrong!</p>
      <ErrorReporter />
    </>
  );
}

export function shouldRevalidate({ nextUrl }: { nextUrl: URL }) {
  return !nextUrl.pathname.endsWith("/about");
}
