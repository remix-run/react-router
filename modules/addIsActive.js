import { pathnameIsActive, queryIsActive } from './ActiveMixin';

/**
 * History enhancer that adds an `isActive()` method. Specific to React Router.
 * @param {CreateHistory} createHistory - History-creating function
 * @returns {CreateHistory}
 */
export default function addIsActive(createHistory) {
  return options => {
    const router = createHistory(options);

    function isActive(pathname, query) {
      const { location, routes, params } = router.getState() || {};

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
    };
  }
}
