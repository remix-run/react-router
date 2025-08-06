import { defineConfig } from "vite";
import { __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__ } from "@react-router/dev/internal";

const { unstable_reactRouterRSC: reactRouterRSC } =
  __INTERNAL_DO_NOT_USE_OR_YOU_WILL_GET_A_STRONGLY_WORDED_LETTER__;

export default defineConfig({
  plugins: [reactRouterRSC()],
});
