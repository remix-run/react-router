import { createLocation } from "history";

export function resolveToLocation(to, currentLocation) {
  return typeof to === "function" ? to(currentLocation) : to;
}

export function normalizeToLocation(to, currentLocation) {
  return typeof to === "string"
    ? createLocation(to, null, null, currentLocation)
    : to;
}
