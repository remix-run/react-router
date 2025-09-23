import { startMeasure } from "~/o11y";
import { type Route } from "../../.react-router/types/app/routes/+types/slug";

let sleep = (ms: number = Math.max(100, Math.round(Math.random() * 500))) =>
  new Promise((r) => setTimeout(r, ms));

export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    await sleep();
    await next();
    await sleep();
  },
];

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  async (_, next) => {
    await sleep();
    await next();
    await sleep();
  },
];

export async function loader({ params }: Route.LoaderArgs) {
  await sleep();
  return params.slug;
}

export async function clientLoader({
  serverLoader,
  pattern,
}: Route.ClientLoaderArgs) {
  await sleep();
  let end = startMeasure(["serverLoader", pattern]);
  let value = await serverLoader();
  end();
  await sleep();
  return value;
}

export default function Slug({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Slug: {loaderData}</h1>
    </div>
  );
}
