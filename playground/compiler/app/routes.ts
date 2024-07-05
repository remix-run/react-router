import { routes } from "@react-router/dev";

export default routes({
  file: "root.tsx",
  children: [
    {
      index: true,
      file: "routes/_index.tsx",
    },
  ],
});
