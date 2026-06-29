### What's Changed

#### Agent Skills Installation via `create-react-router`

`create-react-router` can now setup the React Router [Agent Skill](https://github.com/remix-run/react-router/tree/main/.agents/skills/react-router) in your new project. Interactive shells will issue a prompt on whether to include the skills, and they will be included by default with when running with `--yes` or in non-interactive shells. You can skip the skill addition with the `--no-agent-skills` CLI flag.

#### Observability Metadata

The Instrumentation APIs `info` parameter usually corresponds roughly to the inputs to the thing being instrumented (`handler`, `loader`, etc.). For route level instrumentations such as loaders, this contains useful information like the `pattern` (i.e., `/blog/:slug`) that allows you to report information that is easily aggregated by pattern, instead of having to manually deduce one from the request url.

However, for outer layers such as the `handler` or a router `navigate` call - we can't provide a `pattern` because we haven't yet done any route matching, so it wasn't easy to report at those levels based on a generic route pattern.

The internal instrumentation results now contain relevant metadata in `result.meta` for these outer instrumentation layers. For server `handler` instrumentations, we also expose the `statusCode` of the outgoing HTTP response:

```ts
export const instrumentations = [
  {
    handler(handler) {
      handler.instrument({
        async request(handleRequest) {
          let result = await handleRequest();

          // Available to server `handler`, and router `navigate`/`fetch` instrumentations
          let normalizedUrl = result.meta?.url;
          let routePattern = result.meta?.pattern;
          let routeParams = result.meta?.params;

          // Available to server `handler` only
          let statusCode = result.statusCode;
        },
      });
    },
  },
];
```

Please see the [docs](https://reactrouter.com/how-to/instrumentation#result-metadata) for more information.
