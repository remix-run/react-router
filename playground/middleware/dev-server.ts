import express from "express";

const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

console.log("Starting development server");
const viteDevServer = await import("vite").then((vite) =>
  vite.createServer({
    server: { middlewareMode: true },
    forceOptimizeDeps: process.argv.includes("--force"),
  })
);
app.use(viteDevServer.middlewares);
app.use(async (req, res, next) => {
  try {
    const source = await viteDevServer.ssrLoadModule("./server.ts");
    return await source.app(req, res, next);
  } catch (error) {
    if (typeof error === "object" && error instanceof Error) {
      viteDevServer.ssrFixStacktrace(error);
    }
    next(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
