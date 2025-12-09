import type * as Vite from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface PrerenderFile {
  /**
   * The filename relative to the build output directory
   * e.g., "about.html", "api/data.json", "about/index.html"
   *
   * Leading slash will be removed if present ("/about.html" -> "about.html")
   */
  path: string;
  /**
   * The file contents to write
   */
  contents: string | Uint8Array;
}

/**
 * Request input: string, Request, or object with metadata
 */
export type PrerenderRequest<Metadata extends Record<string, unknown>> =
  | string
  | Request
  | {
      request: string | Request;
      metadata?: Metadata;
    };

/**
 * Result of the `postProcess` option. Return files array, or an object with files and follow-up requests
 */
export type PostProcessResult<Metadata extends Record<string, unknown>> =
  | PrerenderFile[]
  | {
      files: PrerenderFile[];
      requests?: PrerenderRequest<Metadata>[];
    };

export interface PrerenderConfig {
  /**
   * Output directory for prerendered files
   * @default viteConfig.environments.client.build.outDir
   */
  buildDirectory?: string;
  /**
   * Number of concurrent requests to prerender
   * @default 1
   */
  concurrency?: number;
  /**
   * Number of times to retry failed requests
   *
   * Retries 5xx errors and timeout errors. Does not retry 4xx client errors.
   *
   * @default 0
   */
  retryCount?: number;
  /**
   * Delay in milliseconds between retry attempts
   *
   * @default 500
   */
  retryDelay?: number;
  /**
   * Maximum number of redirects to follow
   *
   * @default 0
   */
  maxRedirects?: number;
  /**
   * Request timeout in milliseconds
   *
   * @default 10000
   */
  timeout?: number;
}

export interface PrerenderPluginOptions<
  Metadata extends Record<string, unknown>,
> {
  /**
   * Prerender configuration
   */
  config?:
    | PrerenderConfig
    | ((
        this: Vite.Rollup.PluginContext,
      ) => PrerenderConfig | Promise<PrerenderConfig>);

  /**
   * Requests to prerender
   *
   * Can return simple strings/Requests or objects with metadata.
   * Metadata flows through to postProcess and logFile hooks.
   *
   * If no requests are returned, prerendering is skipped.
   *
   * @example
   * ```ts
   * requests() {
   *   return [
   *     "/",
   *     "/about",
   *     { request: "/api/data", metadata: { type: "api" } },
   *   ];
   * }
   * ```
   */
  requests:
    | PrerenderRequest<Metadata>[]
    | ((
        this: Vite.Rollup.PluginContext,
      ) =>
        | PrerenderRequest<Metadata>[]
        | Promise<PrerenderRequest<Metadata>[]>);

  /**
   * Post-process server responses to generate output files
   *
   * Can return just files, or files with additional requests to process.
   * Follow-up requests go through the same pipeline (retry, redirect, timeout).
   *
   * @example
   * ```ts
   * // Simple: just return files
   * postProcess(request, response) {
   *   return [{ path: "/index.html", contents: await response.text() }];
   * }
   *
   * // With follow-up requests
   * postProcess(request, response, metadata) {
   *   let data = await response.text();
   *   return {
   *     files: [{ path: "/data.json", contents: data }],
   *     requests: [{
   *       request: new Request(htmlUrl, { headers: { "X-Data": data } }),
   *       metadata: { type: "html" }
   *     }]
   *   };
   * }
   * ```
   */
  postProcess?: (
    this: Vite.Rollup.PluginContext,
    request: Request,
    response: Response,
    metadata: Metadata | undefined,
  ) =>
    | NoInfer<PostProcessResult<Metadata>>
    | Promise<NoInfer<PostProcessResult<Metadata>>>;

  /**
   * Handle errors during prerendering
   *
   * If this function does not throw, prerendering continues.
   * If it throws, the build fails.
   */
  handleError?: (
    this: Vite.Rollup.PluginContext,
    request: Request,
    error: Error,
    metadata: Metadata | undefined,
  ) => void;

  /**
   * Log when a file is written
   *
   * Use for custom logging with access to request metadata.
   * If not provided, uses default logging.
   */
  logFile?: (
    this: Vite.Rollup.PluginContext,
    outputPath: string,
    metadata: Metadata | undefined,
  ) => void;

  /**
   * Called after all prerendering is complete
   *
   * Use for cleanup or post-processing of output files.
   */
  finalize?: (
    this: Vite.Rollup.PluginContext,
    buildDirectory: string,
  ) => void | Promise<void>;
}

function normalizePrerenderRequest<Metadata extends Record<string, unknown>>(
  input: PrerenderRequest<Metadata>,
): {
  request: string | Request;
  metadata: Metadata | undefined;
} {
  if (typeof input === "string" || input instanceof Request) {
    return { request: input, metadata: undefined };
  }

  return { request: input.request, metadata: input.metadata };
}

function normalizePostProcessResult<Metadata extends Record<string, unknown>>(
  result: PostProcessResult<Metadata>,
): {
  files: PrerenderFile[];
  requests: PrerenderRequest<Metadata>[];
} {
  if (Array.isArray(result)) {
    return { files: result, requests: [] };
  }

  return { files: result.files, requests: result.requests ?? [] };
}

/**
 * Vite plugin for prerendering using the preview server
 */
export function prerender<Metadata extends Record<string, unknown>>(
  options: PrerenderPluginOptions<Metadata>,
): Vite.Plugin {
  const {
    config,
    requests,
    postProcess = defaultPostProcess,
    handleError = defaultHandleError,
    logFile,
    finalize,
  } = options;

  let viteConfig: Vite.ResolvedConfig;

  return {
    name: "prerender",
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },
    writeBundle: {
      async handler() {
        const pluginContext = this;
        const rawRequests =
          typeof requests === "function"
            ? await requests.call(pluginContext)
            : requests;

        const prerenderRequests = rawRequests.map(normalizePrerenderRequest);

        if (prerenderRequests.length === 0) {
          return;
        }

        const prerenderConfig =
          typeof config === "function"
            ? await config.call(pluginContext)
            : config;
        const {
          buildDirectory = viteConfig.environments.client.build.outDir,
          concurrency = 1,
          retryCount = 0,
          retryDelay = 500,
          maxRedirects = 0,
          timeout = 10000,
        } = prerenderConfig ?? {};

        const previewServer = await startPreviewServer(viteConfig);

        try {
          const baseUrl = getResolvedUrl(previewServer);

          async function prerenderRequest(
            input: string | Request,
            metadata: Metadata | undefined,
          ): Promise<PostProcessResult<Metadata>> {
            let attemptCount = 0;
            let redirectCount = 0;

            const request = new Request(input);
            const url = new URL(request.url);

            if (url.origin !== baseUrl.origin) {
              url.hostname = baseUrl.hostname;
              url.protocol = baseUrl.protocol;
              url.port = baseUrl.port;
            }

            async function attempt(
              url: URL,
            ): Promise<PostProcessResult<Metadata>> {
              try {
                const signal = AbortSignal.timeout(timeout);
                const prerenderReq = new Request(url, request);
                const response = await fetch(prerenderReq, {
                  redirect: "manual",
                  signal,
                });

                if (
                  response.status >= 300 &&
                  response.status < 400 &&
                  response.headers.has("location") &&
                  ++redirectCount <= maxRedirects
                ) {
                  const location = response.headers.get("location")!;
                  const responseURL = new URL(response.url);
                  const locationUrl = new URL(location, response.url);

                  // External redirect: pass to postProcess
                  if (responseURL.origin !== locationUrl.origin) {
                    return await postProcess.call(
                      pluginContext,
                      request,
                      response,
                      metadata,
                    );
                  }

                  // Internal redirect within limit: follow it
                  const redirectUrl = new URL(location, url);
                  return await attempt(redirectUrl);
                }

                if (response.status >= 500 && ++attemptCount <= retryCount) {
                  await new Promise((resolve) =>
                    setTimeout(resolve, retryDelay),
                  );
                  return attempt(url);
                }

                return await postProcess.call(
                  pluginContext,
                  request,
                  response,
                  metadata,
                );
              } catch (error) {
                if (++attemptCount <= retryCount) {
                  await new Promise((resolve) =>
                    setTimeout(resolve, retryDelay),
                  );
                  return attempt(url);
                }

                // If handleError does not throw, return empty array and continue
                handleError.call(
                  pluginContext,
                  request,
                  error instanceof Error
                    ? error
                    : new Error(error?.toString() ?? "Unknown error"),
                  metadata,
                );

                return [];
              }
            }

            return attempt(url);
          }

          async function prerender(
            input: string | Request,
            metadata: Metadata | undefined,
          ): Promise<void> {
            const result = await prerenderRequest(input, metadata);
            const { files, requests } = normalizePostProcessResult(result);

            for (const file of files) {
              await writePrerenderFile(file, metadata);
            }

            for (const followUp of requests) {
              const normalized = normalizePrerenderRequest(followUp);
              await prerender(normalized.request, normalized.metadata);
            }
          }

          async function writePrerenderFile(
            file: PrerenderFile,
            metadata: Metadata | undefined,
          ) {
            // Removes leading slash if present (e.g. pathname "/about" -> "about")
            const normalizedPath = file.path.startsWith("/")
              ? file.path.slice(1)
              : file.path;
            const outputPath = path.join(
              buildDirectory,
              ...normalizedPath.split("/"),
            );

            await mkdir(path.dirname(outputPath), { recursive: true });
            await writeFile(outputPath, file.contents);

            const relativePath = path.relative(viteConfig.root, outputPath);

            if (logFile) {
              logFile.call(pluginContext, relativePath, metadata);
            }

            return relativePath;
          }

          const pMap = await import("p-map");
          await pMap.default(
            prerenderRequests,
            async ({ request, metadata }) => {
              await prerender(request, metadata);
            },
            { concurrency },
          );

          if (finalize) {
            await finalize.call(pluginContext, buildDirectory);
          }
        } finally {
          await new Promise<void>((resolve, reject) => {
            previewServer.httpServer.close((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }
      },
    },
  };
}

async function defaultPostProcess(
  request: Request,
  response: Response,
): Promise<PrerenderFile[]> {
  const prerenderPath = new URL(request.url).pathname;

  if (!response.ok) {
    throw new Error(
      `Prerender: Request failed for ${prerenderPath}: ${response.status} ${response.statusText}`,
    );
  }

  return [
    {
      path: `${prerenderPath}/index.html`,
      contents: await response.text(),
    },
  ];
}

function defaultHandleError(request: Request, error: Error): void {
  const prerenderPath = new URL(request.url).pathname;

  if (request.signal?.aborted) {
    throw new Error(
      `Prerender: Request timed out for ${prerenderPath}: ${error.message}`,
    );
  }

  throw new Error(
    `Prerender: Request failed for ${prerenderPath}: ${error.message}`,
  );
}

async function startPreviewServer(
  viteConfig: Vite.ResolvedConfig,
): Promise<Vite.PreviewServer> {
  const vite = await import("vite");

  try {
    return await vite.preview({
      configFile: viteConfig.configFile,
      logLevel: "silent",
      preview: {
        port: 0,
        open: false,
      },
    });
  } catch (error) {
    throw new Error("Prerender: Failed to start Vite preview server", {
      cause: error,
    });
  }
}

function getResolvedUrl(previewServer: Vite.PreviewServer): URL {
  const baseUrl = previewServer.resolvedUrls?.local[0];

  if (!baseUrl) {
    throw new Error(
      "Prerender: No resolved URL is available from the Vite preview server",
    );
  }

  return new URL(baseUrl);
}
