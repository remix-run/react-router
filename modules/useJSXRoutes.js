import { createRoutes } from './RouteUtils';

/**
 * Router enhancer that allows routes to be specified using JSX (React elements)
 * @param {CreateRouter} next - Router-creating function
 * @returns {CreateRouter}
 */
export default function useJSXRoutes(next) {
  return (routes, initialState) => next(createRoutes(routes), initialState);
}
