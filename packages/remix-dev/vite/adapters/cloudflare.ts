export const adapter = () => async () => {
  let { getBindingsProxy } = await import("wrangler");
  let { bindings } = await getBindingsProxy();
  let loadContext = bindings && { env: bindings };
  let viteConfig = {
    ssr: {
      resolve: {
        externalConditions: ["workerd", "worker"],
      },
    },
  };
  return { viteConfig, loadContext };
};
