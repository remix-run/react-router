import type {
  LoaderFunction,
  ActionFunction,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "../router/utils";
import { isDataWithResponseInit, isRedirectStatusCode } from "../router/router";

// Need to use RR's version here to permit the optional context even
// though we know it'll always be provided in remix
export async function callRouteHandler(
  handler: LoaderFunction | ActionFunction,
  args: LoaderFunctionArgs | ActionFunctionArgs,
) {
  let result = await handler({
    request: args.request,
    url: args.url,
    params: args.params,
    context: args.context,
    pattern: args.pattern,
  });

  // If they returned a redirect via data(), re-throw it as a Response
  if (
    isDataWithResponseInit(result) &&
    result.init &&
    result.init.status &&
    isRedirectStatusCode(result.init.status)
  ) {
    throw new Response(null, result.init);
  }

  return result;
}
