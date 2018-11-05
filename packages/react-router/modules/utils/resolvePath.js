export default function resolvePath(path, location) {
  return typeof path === "function" ? path(location) : path;
}
