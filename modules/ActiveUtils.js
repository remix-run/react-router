import { stripLeadingSlashes } from './URLUtils';

export function pathnameIsActive(pathname, activePathname) {
  if (stripLeadingSlashes(activePathname).indexOf(stripLeadingSlashes(pathname)) === 0)
    return true; // This quick comparison satisfies most use cases.

  // TODO: Implement a more stringent comparison that checks
  // to see if the pathname matches any routes (and params)
  // in the currently active branch.

  return false;
}

export function queryIsActive(query, activeQuery) {
  if (activeQuery == null)
    return true;

  if (query == null)
    return false;

  for (var p in activeQuery)
    if (activeQuery.hasOwnProperty(p) && String(query[p]) !== String(activeQuery[p]))
      return false;

  return true;
}
