import { isRouteErrorResponse } from "react-router-dom";

export const getError = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    return error.statusText;
  } else if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
