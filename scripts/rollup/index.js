import reactRouter from "./react-router.js";
import reactRouterDOM from "./react-router-dom.js";
import reactRouterNative from "./react-router-native.js";

export default function rollup(options) {
  return [
    ...reactRouter(options),
    ...reactRouterDOM(options),
    ...reactRouterNative(options)
  ];
}
