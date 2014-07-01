/** This function was copied from the https://github.com/cujojs/rest source, MIT licensed */

var urlEncodedSpaceRE = /\+/g;

function urlDecode(str) {
  // spec says space should be encoded as '+'
  str = str.replace(urlEncodedSpaceRE, ' ');
  return decodeURIComponent(str);
}

module.exports = urlDecode;
