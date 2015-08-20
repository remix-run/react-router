import { pathnameIsActive, queryIsActive } from './ActiveMixin';

/**
 * Router enhancer that adds an `isActive()` method
 * @param {CreateRouter} createRouter - Router-creating function
 * @returns {CreateRouter}
 */
export default function addIsActive(createRouter) {
  return initialState => {
    const router = createRouter(initialState);

    function isActive(pathname, query) {
      const { location, routes, params } = router.getState();

      if (location == null) {
        return false;
      }

      const res = (
        pathnameIsActive(pathname, location.pathname, routes, params) &&
        queryIsActive(query, location.query)
      );

      return res;
    }

    return {
      ...router,
      isActive
    }
  }
}
