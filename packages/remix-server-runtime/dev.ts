import type { ServerBuild } from "./build";

export let devReady = (
  build: ServerBuild,
  options: {
    scheme?: string;
    host?: string;
    port?: number;
  } = {}
) => {
  let scheme = options.scheme ?? "http";
  let host = options.host ?? "localhost";
  let port = options.port ?? Number(process.env.REMIX_DEV_HTTP_PORT);
  if (!port) throw Error("Dev server port not set");
  if (isNaN(port))
    throw Error(
      `Dev server port must be a number. Got: ${JSON.stringify(port)}`
    );

  fetch(`${scheme}://${host}:${port}/ping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buildHash: build.assets.version }),
  });
};
