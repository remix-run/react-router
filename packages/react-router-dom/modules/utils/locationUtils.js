import { createLocation, createPath } from "history";

export const resolveToLocation = (to, currentLocation) =>
  typeof to === "function" ? to(currentLocation) : to;

export const normalizeToLocation = (to, currentLocation) => {
  return typeof to === "string"
    ? createLocation(to, null, null, currentLocation)
    : to;
};

export const getNavigator = (history, currentLocation) => {
  return (to, { replace }) => {
    const location = resolveToLocation(to, currentLocation);
    const isDuplicateNavigation =
      createPath(currentLocation) === createPath(normalizeToLocation(location));
    const method =
      replace || isDuplicateNavigation ? history.replace : history.push;

    method(location);
  };
};
