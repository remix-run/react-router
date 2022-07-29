import * as React from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// By default, we'll render the component via React.lazy().  We'll overwrite
// this with a non-React.lazy() version if and only if the component chunk
// finishes before the loader chunk + loader execution
let CodeSplittingActual = React.lazy(
  () => import("./code-splitting-component")
);

export async function codeSplittingLoader(args: LoaderFunctionArgs) {
  let componentLoadController = new AbortController();

  /*
   * Kick off our component chunk load but don't await it
   * This allows us to parallelize the component download with loader
   * download and execution.
   *
   * Normal React.lazy()
   *
   *   load loader.ts     execute loader()   load component.ts
   *   -----------------> -----------------> ----------------->
   *
   * Kicking off the component load _in_ your loader()
   *
   *   load loader.ts     execute loader()
   *   -----------------> ----------------->
   *                      load component.ts
   *                      ----------------->
   *
   * Kicking off the component load _alongside_ your loader.ts chunk load
   *
   *   load loader.ts     execute loader()
   *   -----------------> ----------------->
   *   load component.ts
   *   ----------------->
   */
  import("./code-splitting-component").then(
    (componentModule) => {
      if (!componentLoadController.signal.aborted) {
        // We loaded the component _before_ our loader finished, so we can
        // blow away React.lazy and just use it directly.  This avoids the
        // flicker we'd otherwise get since React.lazy would need to throw
        // the already-resolved promise up to the Suspense boundary one time
        // to get the resolved value
        CodeSplittingActual = componentModule.default;
      }
    },
    () => {}
  );

  try {
    // Load our loader chunk and call the loader
    let { default: loader } = await import("./code-splitting-loader");
    return await loader(args);
  } finally {
    // Abort the controller when our loader finishes.  If we finish before the
    // component chunk loads, this will ensure we still use React.lazy to
    // render the component since it's not yet available.  If the component
    // chunk finishes first, it will have overwritten Lazy with the legit
    // component so we'll never see the suspense fallback
    componentLoadController.abort();
  }
}

export function CodeSplittingWrapper() {
  console.log(CodeSplittingActual);
  return (
    <React.Suspense fallback={<p>Loading component...</p>}>
      <CodeSplittingActual />
    </React.Suspense>
  );
}
