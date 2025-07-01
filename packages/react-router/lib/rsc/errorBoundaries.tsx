import React from "react";
import { useRouteError } from "../hooks";
import type { Location } from "../router/history";
import { isRouteErrorResponse } from "../router/utils";
import { ENABLE_DEV_WARNINGS } from "../context";

type RSCRouterGlobalErrorBoundaryProps = React.PropsWithChildren<{
  location: Location;
}>;

type RSCRouterGlobalErrorBoundaryState = {
  error: null | Error;
  location: Location;
};

export class RSCRouterGlobalErrorBoundary extends React.Component<
  RSCRouterGlobalErrorBoundaryProps,
  RSCRouterGlobalErrorBoundaryState
> {
  constructor(props: RSCRouterGlobalErrorBoundaryProps) {
    super(props);
    this.state = { error: null, location: props.location };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: RSCRouterGlobalErrorBoundaryProps,
    state: RSCRouterGlobalErrorBoundaryState
  ) {
    // When we get into an error state, the user will likely click "back" to the
    // previous page that didn't have an error. Because this wraps the entire
    // application (even the HTML!) that will have no effect--the error page
    // continues to display. This gives us a mechanism to recover from the error
    // when the location changes.
    //
    // Whether we're in an error state or not, we update the location in state
    // so that when we are in an error state, it gets reset when a new location
    // comes in and the user recovers from the error.
    if (state.location !== props.location) {
      return { error: null, location: props.location };
    }

    // If we're not changing locations, preserve the location but still surface
    // any new errors that may come through. We retain the existing error, we do
    // this because the error provided from the app state may be cleared without
    // the location changing.
    return { error: state.error, location: state.location };
  }

  render() {
    if (this.state.error) {
      return (
        <RSCDefaultRootErrorBoundaryImpl
          error={this.state.error}
          renderAppShell={true}
        />
      );
    } else {
      return this.props.children;
    }
  }
}

function ErrorWrapper({
  renderAppShell,
  title,
  children,
}: {
  renderAppShell: boolean;
  title: string;
  children: React.ReactNode;
}) {
  if (!renderAppShell) {
    return children;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <title>{title}</title>
      </head>
      <body>
        <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}

function RSCDefaultRootErrorBoundaryImpl({
  error,
  renderAppShell,
}: {
  error: unknown;
  renderAppShell: boolean;
}) {
  console.error(error);

  let heyDeveloper = (
    <script
      dangerouslySetInnerHTML={{
        __html: `
        console.log(
          "💿 Hey developer 👋. You can provide a way better UX than this when your app throws errors. Check out https://reactrouter.com/how-to/error-boundary for more information."
        );
      `,
      }}
    />
  );

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorWrapper
        renderAppShell={renderAppShell}
        title="Unhandled Thrown Response!"
      >
        <h1 style={{ fontSize: "24px" }}>
          {error.status} {error.statusText}
        </h1>
        {ENABLE_DEV_WARNINGS ? heyDeveloper : null}
      </ErrorWrapper>
    );
  }

  let errorInstance: Error;
  if (error instanceof Error) {
    errorInstance = error;
  } else {
    let errorString =
      error == null
        ? "Unknown Error"
        : typeof error === "object" && "toString" in error
          ? error.toString()
          : JSON.stringify(error);
    errorInstance = new Error(errorString);
  }

  return (
    <ErrorWrapper renderAppShell={renderAppShell} title="Application Error!">
      <h1 style={{ fontSize: "24px" }}>Application Error</h1>
      <pre
        style={{
          padding: "2rem",
          background: "hsla(10, 50%, 50%, 0.1)",
          color: "red",
          overflow: "auto",
        }}
      >
        {errorInstance.stack}
      </pre>
      {heyDeveloper}
    </ErrorWrapper>
  );
}

export function RSCDefaultRootErrorBoundary({
  hasRootLayout,
}: {
  hasRootLayout: boolean;
}) {
  let error = useRouteError();

  if (hasRootLayout === undefined) {
    throw new Error("Missing 'hasRootLayout' prop");
  }
  return (
    <RSCDefaultRootErrorBoundaryImpl
      renderAppShell={!hasRootLayout}
      error={error}
    />
  );
}
