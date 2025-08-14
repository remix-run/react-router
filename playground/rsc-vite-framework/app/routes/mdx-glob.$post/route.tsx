import type { Route } from "./+types/route";
import { getPost } from "./posts/posts";

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPost(params.post);

  if (!post) {
    throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  }

  return {
    title: post.title,
    element: <post.Component />,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData.title }];
}

export function ServerComponent({ loaderData }: Route.ComponentProps) {
  return loaderData.element;
}
