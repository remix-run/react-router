import type { Pages } from "./types/register";
import type { Equal } from "./types/utils";

type Args = { [K in keyof Pages]: ToArgs<Pages[K]["params"]> };

// prettier-ignore
type ToArgs<Params extends Record<string, string | undefined>> =
  // path without params -> no `params` arg
  Equal<Params, {}> extends true ? [] :
  // path with only optional params -> optional `params` arg
  Partial<Params> extends Params ? [Params] | [] :
  // otherwise, require `params` arg
  [Params];

/**
  Returns a resolved URL path for the specified route.

  ```tsx
  const h = href("/:lang?/about", { lang: "en" })
  // -> `/en/about`

  <Link to={href("/products/:id", { id: "abc123" })} />
  ```
 */
export function href<Path extends keyof Args>(
  path: Path,
  ...args: Args[Path]
): string {
  let params = args[0];
  let result = trimEndSplat(path) // Ignore trailing / and /*, we'll handle it below
    .replace(
      /\/:([\w-]+)(\?)?/g, // same regex as in .\router\utils.ts: compilePath().
      (_: string, param: string, questionMark: string | undefined) => {
        const isRequired = questionMark === undefined;
        const value = params ? params[param] : undefined;
        if (isRequired && value === undefined) {
          throw new Error(
            `Path '${path}' requires param '${param}' but it was not provided`,
          );
        }
        return value === undefined ? "" : "/" + value;
      },
    );

  if (path.endsWith("*")) {
    // treat trailing splat the same way as compilePath, and force it to be as if it were `/*`.
    // `react-router typegen` will not generate the params for a malformed splat, causing a type error, but we can still do the correct thing here.
    const value = params ? params["*"] : undefined;
    if (value !== undefined) {
      result += "/" + value;
    }
  }

  return result || "/";
}

/**
  Removes a trailing splat and any number of slashes from the end of the path.

  Benchmarks as running faster than `path.replace(/\/*\*?$/, "")`, which backtracks.
  
  just this function (17x to 36x speed of regex):
  https://jsbenchmark.com/#eyJjYXNlcyI6W3siaWQiOiJoM2NSc2pHaHB3UEZvVlJJVjV5b0wiLCJjb2RlIjoiREFUQS50cmltRW5kU3BsYXQxKERBVEEucGF0aEEpIiwibmFtZSI6IiIsImRlcGVuZGVuY2llcyI6W119LHsiaWQiOiJEX0hab2MxSGxFQVljekR4bjlmLXgiLCJjb2RlIjoiREFUQS50cmltRW5kU3BsYXQxKERBVEEucGF0aEIpIiwibmFtZSI6IiIsImRlcGVuZGVuY2llcyI6W119LHsiaWQiOiJOTWRYalVicHhyY19QbjlHU25fYlkiLCJjb2RlIjoiREFUQS50cmltRW5kU3BsYXQxKERBVEEucGF0aEMpIiwibmFtZSI6IiIsImRlcGVuZGVuY2llcyI6W119LHsiaWQiOiJuY1IyTkVsekxKNGN6R08zb2tlUFciLCJjb2RlIjoiREFUQS50cmltRW5kU3BsYXQyKERBVEEucGF0aEEpIiwiZGVwZW5kZW5jaWVzIjpbXX0seyJpZCI6IlBxeXRDSUpPVUJsYXM5azVwYkFzRyIsImNvZGUiOiJEQVRBLnRyaW1FbmRTcGxhdDIoREFUQS5wYXRoQikiLCJkZXBlbmRlbmNpZXMiOltdfSx7ImlkIjoiclNlQ3d3SzdDczZ1bGpoZE13VDE0IiwiY29kZSI6IkRBVEEudHJpbUVuZFNwbGF0MihEQVRBLnBhdGhDKSIsImRlcGVuZGVuY2llcyI6W119XSwiY29uZmlnIjp7Im5hbWUiOiJCYXNpYyBleGFtcGxlIiwicGFyYWxsZWwiOnRydWUsImdsb2JhbFRlc3RDb25maWciOnsiZGVwZW5kZW5jaWVzIjpbXX0sImRhdGFDb2RlIjoiZnVuY3Rpb24gdHJpbUVuZFNwbGF0MShwYXRoKSB7XG4gIHJldHVybiBwYXRoLnJlcGxhY2UoL1xcLypcXCo_JC8sIFwiXCIpO1xufVxuXG5mdW5jdGlvbiB0cmltRW5kU3BsYXQyKHBhdGgpIHtcbiAgbGV0IGkgPSBwYXRoLmxlbmd0aCAtIDE7XG4gIGxldCBjaGFyID0gcGF0aFtpXTtcbiAgaWYgKGNoYXIgIT09IFwiKlwiICYmIGNoYXIgIT09IFwiL1wiKSB7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cbiAgaS0tO1xuICBmb3IgKDsgaSA-PSAwOyBpLS0pIHtcbiAgICAvLyBmb3IvYnJlYWsgYmVuY2htYXJrcyBmYXN0ZXIgdGhhbiBkby93aGlsZVxuICAgIGlmIChwYXRoW2ldICE9PSBcIi9cIikge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKDAsIGkgKyAxKTtcbn1cblxucmV0dXJuIERBVEEgPSB7XG4gIHRyaW1FbmRTcGxhdDEsXG4gIHRyaW1FbmRTcGxhdDIsXG4gIHBhdGhBOiBcIi95aXJlbGJtcGNuLypcIixcbiAgcGF0aEI6IFwiL3hrZnFzb2lkdWMvXCIsXG4gIHBhdGhDOiBcIi90cHBuaHRod2VsL3ZtcWpjYmVjbGRcIixcbn0ifX0

  href options (1.2x to 1.5x speed of original):
  https://jsbenchmark.com/#eyJjYXNlcyI6W3siaWQiOiJReExCWUJVN3d3SjN5Yi1RVFRYdTQiLCJjb2RlIjoiREFUQS5ocmVmMShcIi9hLzpiPy86Yi86Yj8vOmJcIiwgeyBiOiBcImhlbGxvXCIgfSkiLCJkZXBlbmRlbmNpZXMiOltdLCJuYW1lIjoiaHJlZjFsb25nIn0seyJpZCI6IjAzWHJuRjhDMnA2Um5XTHBTRmdMLSIsImNvZGUiOiJEQVRBLmhyZWYxKFwiL2EvOmJcIiwgeyBiOiBcImhlbGxvXCIgfSkiLCJkZXBlbmRlbmNpZXMiOltdLCJuYW1lIjoiaHJlZjFzaG9ydCJ9LHsiaWQiOiIwcGV5WU9raGJrd05SYlAzLXpIYUsiLCJjb2RlIjoiREFUQS5ocmVmMShcIi9hLypcIiwgeyBcIipcIjogXCJiL2NcIiB9KSIsImRlcGVuZGVuY2llcyI6W10sIm5hbWUiOiJocmVmMXNwbGF0In0seyJpZCI6IkhaTHFxS20zMDFnOTNiaEpYMW5tMyIsImNvZGUiOiJEQVRBLmhyZWYyKFwiL2EvOmI_LzpiLzpiPy86YlwiLCB7IGI6IFwiaGVsbG9cIiB9KSIsImRlcGVuZGVuY2llcyI6W10sIm5hbWUiOiJocmVmMmxvbmcifSx7ImlkIjoiRlJ5clZFamx4dmxWaVdZcThpdnFuIiwiY29kZSI6IkRBVEEuaHJlZjIoXCIvYS86YlwiLCB7IGI6IFwiaGVsbG9cIiB9KSIsImRlcGVuZGVuY2llcyI6W10sIm5hbWUiOiJocmVmMnNob3J0In0seyJpZCI6Ingzd1NkZ2FFc01GYVczRGhnWGo0QyIsImNvZGUiOiJEQVRBLmhyZWYyKFwiL2EvKlwiLCB7IFwiKlwiOiBcImIvY1wiIH0pIiwiZGVwZW5kZW5jaWVzIjpbXSwibmFtZSI6ImhyZWYyc3BsYXQifV0sImNvbmZpZyI6eyJuYW1lIjoiIiwicGFyYWxsZWwiOmZhbHNlLCJkYXRhQ29kZSI6ImZ1bmN0aW9uIGhyZWYxKHBhdGgsIC4uLmFyZ3MpIHtcbiAgICBsZXQgcGFyYW1zID0gYXJnc1swXTtcbiAgICBsZXQgcmVzdWx0ID0gcGF0aFxuICAgICAgICAucmVwbGFjZSgvXFwvKlxcKj8kLywgXCJcIikgLy8gSWdub3JlIHRyYWlsaW5nIC8gYW5kIC8qLCB3ZSdsbCBoYW5kbGUgaXQgYmVsb3dcbiAgICAgICAgLnJlcGxhY2UoL1xcLzooW1xcdy1dKykoXFw_KT8vZywgLy8gc2FtZSByZWdleCBhcyBpbiAuXFxyb3V0ZXJcXHV0aWxzLnRzOiBjb21waWxlUGF0aCgpLlxuICAgIChfLCBwYXJhbSwgcXVlc3Rpb25NYXJrKSA9PiB7XG4gICAgICAgIGNvbnN0IGlzUmVxdWlyZWQgPSBxdWVzdGlvbk1hcmsgPT09IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJhbXMgPyBwYXJhbXNbcGFyYW1dIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAoaXNSZXF1aXJlZCAmJiB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBhdGggJyR7cGF0aH0nIHJlcXVpcmVzIHBhcmFtICcke3BhcmFtfScgYnV0IGl0IHdhcyBub3QgcHJvdmlkZWRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA_IFwiXCIgOiBcIi9cIiArIHZhbHVlO1xuICAgIH0pO1xuICAgIGlmIChwYXRoLmVuZHNXaXRoKFwiKlwiKSkge1xuICAgICAgICAvLyB0cmVhdCB0cmFpbGluZyBzcGxhdCB0aGUgc2FtZSB3YXkgYXMgY29tcGlsZVBhdGgsIGFuZCBmb3JjZSBpdCB0byBiZSBhcyBpZiBpdCB3ZXJlIGAvKmAuXG4gICAgICAgIC8vIGByZWFjdC1yb3V0ZXIgdHlwZWdlbmAgd2lsbCBub3QgZ2VuZXJhdGUgdGhlIHBhcmFtcyBmb3IgYSBtYWxmb3JtZWQgc3BsYXQsIGNhdXNpbmcgYSB0eXBlIGVycm9yLCBidXQgd2UgY2FuIHN0aWxsIGRvIHRoZSBjb3JyZWN0IHRoaW5nIGhlcmUuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyYW1zID8gcGFyYW1zW1wiKlwiXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBcIi9cIiArIHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQgfHwgXCIvXCI7XG59XG5cbmZ1bmN0aW9uIHRyaW1FbmRTcGxhdChwYXRoKSB7XG4gIGxldCBpID0gcGF0aC5sZW5ndGggLSAxO1xuICBsZXQgY2hhciA9IHBhdGhbaV07XG4gIGlmIChjaGFyICE9PSBcIipcIiAmJiBjaGFyICE9PSBcIi9cIikge1xuICAgIHJldHVybiBwYXRoO1xuICB9XG4gIGktLTtcbiAgZm9yICg7IGkgPj0gMDsgaS0tKSB7XG4gICAgLy8gZm9yL2JyZWFrIGJlbmNobWFya3MgZmFzdGVyIHRoYW4gZG8vd2hpbGVcbiAgICBpZiAocGF0aFtpXSAhPT0gXCIvXCIpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZSgwLCBpICsgMSk7XG59XG5cbmZ1bmN0aW9uIGhyZWYyKHBhdGgsIC4uLmFyZ3MpIHtcbiAgICBsZXQgcGFyYW1zID0gYXJnc1swXTtcbiAgICBsZXQgcmVzdWx0ID0gdHJpbUVuZFNwbGF0KHBhdGgpIC8vIElnbm9yZSB0cmFpbGluZyAvIGFuZCAvKiwgd2UnbGwgaGFuZGxlIGl0IGJlbG93XG4gICAgICAgIC5yZXBsYWNlKC9cXC86KFtcXHctXSspKFxcPyk_L2csIC8vIHNhbWUgcmVnZXggYXMgaW4gLlxccm91dGVyXFx1dGlscy50czogY29tcGlsZVBhdGgoKS5cbiAgICAoXywgcGFyYW0sIHF1ZXN0aW9uTWFyaykgPT4ge1xuICAgICAgICBjb25zdCBpc1JlcXVpcmVkID0gcXVlc3Rpb25NYXJrID09PSB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyYW1zID8gcGFyYW1zW3BhcmFtXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGlzUmVxdWlyZWQgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQYXRoICcke3BhdGh9JyByZXF1aXJlcyBwYXJhbSAnJHtwYXJhbX0nIGJ1dCBpdCB3YXMgbm90IHByb3ZpZGVkYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgPyBcIlwiIDogXCIvXCIgKyB2YWx1ZTtcbiAgICB9KTtcbiAgICBpZiAocGF0aC5lbmRzV2l0aChcIipcIikpIHtcbiAgICAgICAgLy8gdHJlYXQgdHJhaWxpbmcgc3BsYXQgdGhlIHNhbWUgd2F5IGFzIGNvbXBpbGVQYXRoLCBhbmQgZm9yY2UgaXQgdG8gYmUgYXMgaWYgaXQgd2VyZSBgLypgLlxuICAgICAgICAvLyBgcmVhY3Qtcm91dGVyIHR5cGVnZW5gIHdpbGwgbm90IGdlbmVyYXRlIHRoZSBwYXJhbXMgZm9yIGEgbWFsZm9ybWVkIHNwbGF0LCBjYXVzaW5nIGEgdHlwZSBlcnJvciwgYnV0IHdlIGNhbiBzdGlsbCBkbyB0aGUgY29ycmVjdCB0aGluZyBoZXJlLlxuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmFtcyA_IHBhcmFtc1tcIipcIl0gOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gXCIvXCIgKyB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0IHx8IFwiL1wiO1xufVxuXG5yZXR1cm4gREFUQSA9IHtcbiAgICBocmVmMSxcbiAgICBocmVmMixcbn07IiwiZ2xvYmFsVGVzdENvbmZpZyI6eyJkZXBlbmRlbmNpZXMiOltdfX19
 */
function trimEndSplat(path: string): string {
  let i = path.length - 1;
  let char = path[i];
  if (char !== "*" && char !== "/") {
    return path;
  }
  i--;
  for (; i >= 0; i--) {
    // for/break benchmarks faster than do/while
    if (path[i] !== "/") {
      break;
    }
  }
  return path.slice(0, i + 1);
}
