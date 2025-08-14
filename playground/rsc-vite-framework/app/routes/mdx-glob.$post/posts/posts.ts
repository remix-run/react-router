import nodePath from "node:path";

type BlogPost = {
  Component: React.ComponentType;
  path: string;
  title: string;
  slug: string;
};

async function resolvePosts(): Promise<{
  [slug: string]: () => Promise<BlogPost>;
}> {
  const rawPosts = (await import.meta.glob("./*/*.mdx")) as Record<
    string,
    () => Promise<{
      default: React.ComponentType;
      frontmatter?: unknown;
    }>
  >;

  return Object.fromEntries(
    Object.entries(rawPosts).map(([path, loadPost]) => {
      const slug = path.split("/").pop()!.replace(".mdx", "");

      return [
        slug,
        async (): Promise<BlogPost> => {
          const post = await loadPost();

          let title: string;
          if (
            post.frontmatter &&
            typeof post.frontmatter === "object" &&
            "title" in post.frontmatter &&
            typeof post.frontmatter.title === "string"
          ) {
            title = post.frontmatter.title;
          } else {
            const prettyPath = nodePath.relative(
              process.cwd(),
              nodePath.resolve(import.meta.dirname, path),
            );
            console.error(
              `Invalid frontmatter for ${prettyPath}: Missing title`,
            );
            title = "Untitled Post";
          }

          return {
            Component: post.default,
            path: `/mdx-glob/${slug}`,
            title,
            slug,
          };
        },
      ];
    }),
  );
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const posts = await resolvePosts();
  const loadPost = posts[slug];
  return loadPost ? await loadPost() : null;
}

export async function getPosts(): Promise<Record<string, BlogPost>> {
  const posts = await resolvePosts();
  return Object.fromEntries(
    await Promise.all(
      Object.entries(posts).map(async ([slug, loadPost]) => {
        return [slug, await loadPost()];
      }),
    ),
  );
}
