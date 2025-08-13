type BlogPost = {
  Component: React.ComponentType;
  title: string;
  slug: string;
  path: string;
};

async function resolvePosts(): Promise<
  Record<string, () => Promise<BlogPost>>
> {
  const rawPosts = (await import.meta.glob("./*/*.mdx")) as Record<
    string,
    () => Promise<{
      default: React.ComponentType;
      frontmatter: { title: string };
    }>
  >;

  return Object.fromEntries(
    Object.entries(rawPosts).map(([path, loadPost]) => {
      const slug = path.split("/").pop()!.replace(".mdx", "");

      return [
        slug,
        async (): Promise<BlogPost> => {
          const pathParts = path.split("/");
          const directoryName = pathParts[pathParts.length - 2];

          if (directoryName !== slug) {
            throw new Error(
              `Invalid post structure: directory name "${directoryName}" does not match slug "${slug}" in path "${path}"`,
            );
          }

          const post = await loadPost();

          if (
            !post?.frontmatter ||
            typeof post.frontmatter !== "object" ||
            !("title" in post.frontmatter) ||
            typeof post.frontmatter.title !== "string"
          ) {
            throw new Error(`Invalid frontmatter for ${path}`);
          }

          return {
            Component: post.default,
            title: post.frontmatter.title,
            slug,
            path: `/mdx-glob/${slug}`,
          };
        },
      ];
    }),
  );
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await resolvePosts();
  const loadPost = posts[slug];

  if (!loadPost) {
    return undefined;
  }

  return await loadPost();
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
