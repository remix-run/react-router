/** This function was copied from the https://github.com/cujojs/rest source, MIT licensed */

var encodedSpaceRE = /%20/g;

function urlEncode(str) {
  str = encodeURIComponent(str);
  // spec says space should be encoded as '+'
  return str.replace(encodedSpaceRE, '+');
}

module.exports = urlEncode;
