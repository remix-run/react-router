import { createRoutes } from './RouteUtils';

/**
 * Router enhancer that allows routes to be specified using JSX (React elements)
 * @param {CreateRouter} createRouter - Router-creating function
 * @returns {CreateRouter}
 */
export default function useJSXRoutes(createRouter) {
  return (routes, initialState) => createRouter(createRoutes(routes), initialState);
}
