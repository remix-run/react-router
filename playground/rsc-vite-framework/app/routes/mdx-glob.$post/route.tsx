import type { Route } from "./+types/route";
import { getPost } from "./posts/posts";

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPost(params.post);

  if (!post) {
    throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  }

  return { postElement: <post.Component /> };
}

export function ServerComponent({ loaderData }: Route.ComponentProps) {
  return loaderData.postElement;
}
