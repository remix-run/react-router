import { type RouteConfig, index, route } from "@react-router/dev/routes";

const r = (path: string) => route(path, "routes/route.tsx" , { id: path });

export default [
  // Root index
  index("routes/route.tsx"),

  // Top-level static routes (1-9)
  r("about"),
  r("contact"),
  r("pricing"),
  r("blog"),
  r("docs"),
  r("faq"),
  r("terms"),
  r("privacy"),
  r("sitemap"),

  // Auth routes (10-14)
  r("login"),
  r("logout"),
  r("signup"),
  r("forgot-password"),
  r("reset-password"),

  // Account routes (15-19)
  r("account"),
  r("account/settings"),
  r("account/security"),
  r("account/notifications"),
  r("account/billing"),

  // Settings routes (20-24)
  r("settings"),
  r("settings/profile"),
  r("settings/password"),
  r("settings/appearance"),
  r("settings/integrations"),

  // Dashboard routes (25-27)
  r("dashboard"),
  r("dashboard/overview"),
  r("dashboard/:widgetId"),

  // Admin static routes (28-40)
  r("admin"),
  r("admin/dashboard"),
  r("admin/settings"),
  r("admin/settings/general"),
  r("admin/settings/email"),
  r("admin/settings/security"),
  r("admin/analytics"),
  r("admin/analytics/users"),
  r("admin/analytics/content"),
  r("admin/users"),
  r("admin/posts"),
  r("admin/comments"),
  r("admin/reports"),

  // Commerce routes (41-46)
  r("products"),
  r("orders"),
  r("checkout"),
  r("checkout/confirmation"),

  // Content routes (47-53)
  r("search"),
  r("feed"),
  r("categories"),
  r("tags"),
  r("posts"),
  r("posts/new"),
  r("users"),

  // Docs static routes (54-60)
  r("docs/getting-started"),
  r("docs/installation"),
  r("docs/configuration"),
  r("docs/api"),
  r("docs/examples"),
  r("docs/guides"),
  r("docs/changelog"),

  // Notifications & messages (61-63)
  r("notifications"),
  r("messages"),
  r("inbox"),

  // User dynamic routes (64-71)
  r("users/:userId"),
  r("users/:userId/profile"),
  r("users/:userId/settings"),
  r("users/:userId/edit"),
  r("users/:userId/posts"),
  r("users/:userId/followers"),
  r("users/:userId/following"),
  r("users/:userId/activity"),

  // Post dynamic routes (72-77)
  r("posts/:postId"),
  r("posts/:postId/edit"),
  r("posts/:postId/comments"),
  r("posts/:postId/likes"),
  r("posts/:postId/comments/:commentId"),
  r("users/:userId/posts/:postId"),

  // Category & tag dynamic routes (78-83)
  r("categories/:categoryId"),
  r("categories/:categoryId/posts"),
  r("tags/:tagId"),
  r("tags/:tagId/posts"),
  r("blog/:slug"),
  r("blog/tag/:tag"),

  // Blog author route (84)
  r("blog/author/:author"),

  // Product dynamic routes (85-88)
  r("products/:productId"),
  r("products/:productId/reviews"),
  r("products/:productId/reviews/:reviewId"),
  r("products/:productId/related"),

  // Order dynamic routes (89-92)
  r("orders/:orderId"),
  r("orders/:orderId/items"),
  r("orders/:orderId/tracking"),
  r("orders/:orderId/return"),

  // Admin dynamic routes (93-99)
  r("admin/users/:userId"),
  r("admin/users/:userId/edit"),
  r("admin/users/:userId/ban"),
  r("admin/posts/:postId"),
  r("admin/posts/:postId/edit"),
  r("admin/comments/:commentId"),
  r("admin/comments/:commentId/delete"),

  // Docs & messages dynamic routes (100-101, trim to exactly 100 total)
  r("docs/api/:section"),
  r("messages/:conversationId"),
  r("settings/integrations/:integrationId"),
] satisfies RouteConfig;
