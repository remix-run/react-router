import * as React from "react";
import { useActionData, useLoaderData, useParams } from "./hooks";

export function withComponentProps(
  Component: React.ComponentType<{
    params: unknown;
    loaderData: unknown;
    actionData: unknown;
  }>
) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
    };
    return <Component {...props} />;
  };
}

export function withHydrateFallbackProps(
  HydrateFallback: React.ComponentType<{ params: unknown }>
) {
  return function Wrapped() {
    const props = {
      params: useParams(),
    };
    return <HydrateFallback {...props} />;
  };
}

export function withErrorBoundaryProps(
  ErrorBoundary: React.ComponentType<{
    params: unknown;
    loaderData: unknown;
    actionData: unknown;
  }>
) {
  return function Wrapped() {
    const props = {
      params: useParams(),
      loaderData: useLoaderData(),
      actionData: useActionData(),
    };
    return <ErrorBoundary {...props} />;
  };
}
