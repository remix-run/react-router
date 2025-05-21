import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/record", "routes/record.tsx"),
  route("/create_record", "routes/create_record/route.tsx", [
    index("routes/create_record/form_part1.tsx"),
    route("form_part2", "routes/create_record/form_part2.tsx"),
  ]),
] satisfies RouteConfig;
