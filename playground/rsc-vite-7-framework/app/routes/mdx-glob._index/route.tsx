import { Link } from "react-router";
import { getPosts } from "../mdx-glob.$post/posts/posts";

export async function ServerComponent() {
  const posts = await getPosts();

  return (
    <>
      <h1>MDX glob</h1>
      <ul>
        {Object.values(posts).map(({ path, title }) => (
          <li key={path}>
            <Link to={path}>{title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
