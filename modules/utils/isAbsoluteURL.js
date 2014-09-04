var ABSOLUTE_URL_FORMAT = /^https?:\/\//;

/**
 * Returns true if the given string contains an absolute URL
 * according to http://tools.ietf.org/html/rfc3986#page-27.
 */
function isAbsoluteURL(string) {
  return typeof string === 'string' && ABSOLUTE_URL_FORMAT.test(string);
}

module.exports = isAbsoluteURL;
