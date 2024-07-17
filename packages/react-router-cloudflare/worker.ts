import type { AppLoadContext, ServerBuild } from "react-router";
import { createRequestHandler as createReactRouterRequestHandler } from "react-router";
import { type CacheStorage } from "@cloudflare/workers-types";

/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
export type GetLoadContextFunction<
  Env = unknown,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (args: {
  request: Request;
  context: {
    cloudflare: EventContext<Env, Params, Data> & {
      cf: EventContext<Env, Params, Data>["request"]["cf"];
      ctx: {
        waitUntil: EventContext<Env, Params, Data>["waitUntil"];
        passThroughOnException: EventContext<
          Env,
          Params,
          Data
        >["passThroughOnException"];
      };
      caches: CacheStorage;
    };
  };
}) => AppLoadContext | Promise<AppLoadContext>;

export type RequestHandler<Env = any> = PagesFunction<Env>;

export interface createPagesFunctionHandlerParams<Env = any> {
  build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
  getLoadContext?: GetLoadContextFunction<Env>;
  mode?: string;
}

export function createRequestHandler<Env = any>({
  build,
  mode,
  getLoadContext = ({ context }) => ({
    ...context,
    cloudflare: {
      ...context.cloudflare,
      cf: context.cloudflare.request.cf,
    },
  }),
}: createPagesFunctionHandlerParams<Env>): RequestHandler<Env> {
  let handleRequest = createReactRouterRequestHandler(build, mode);

  return async (cloudflare) => {
    let loadContext = await getLoadContext({
      request: cloudflare.request,
      context: {
        cloudflare: {
          ...cloudflare,
          cf: cloudflare.request.cf!,
          ctx: {
            waitUntil: cloudflare.waitUntil.bind(cloudflare),
            passThroughOnException:
              cloudflare.passThroughOnException.bind(cloudflare),
          },
          caches,
        },
      },
    });

    return handleRequest(cloudflare.request, loadContext);
  };
}

declare const process: any;

export function createPagesFunctionHandler<Env = any>({
  build,
  getLoadContext,
  mode,
}: createPagesFunctionHandlerParams<Env>) {
  let handleRequest = createRequestHandler<Env>({
    build,
    getLoadContext,
    mode,
  });

  let handleFetch = async (context: EventContext<Env, any, any>) => {
    let response: Response | undefined;

    // https://github.com/cloudflare/wrangler2/issues/117
    context.request.headers.delete("if-none-match");

    try {
      response = await context.env.ASSETS.fetch(
        context.request.url,
        context.request.clone()
      );
      response =
        response && response.status >= 200 && response.status < 400
          ? new Response(response.body, response)
          : undefined;
    } catch {}

    if (!response) {
      response = await handleRequest(context);
    }

    return response;
  };

  return async (context: EventContext<Env, any, any>) => {
    try {
      return await handleFetch(context);
    } catch (error: unknown) {
      if (process.env.NODE_ENV === "development" && error instanceof Error) {
        console.error(error);
        return new Response(error.message || error.toString(), {
          status: 500,
        });
      }

      return new Response("Internal Error", {
        status: 500,
      });
    }
  };
}
