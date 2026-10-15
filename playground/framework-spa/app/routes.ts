import { type RouteConfig, index } from "@react-router/dev/routes";

import transactionRoutes from "~/modules/transactions/routes";
import userManagementRoutes from "~/modules/user-management/routes";

export default [
  index("routes/_index.tsx"),
  ...transactionRoutes,
  ...userManagementRoutes,
] satisfies RouteConfig;
