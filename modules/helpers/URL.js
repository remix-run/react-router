var urlEncodedSpaceRE = /\+/g;
var encodedSpaceRE = /%20/g;

var URL = {

  /* These functions were copied from the https://github.com/cujojs/rest source, MIT licensed */

  decode: function (str) {
    // spec says space should be encoded as '+'
    str = str.replace(urlEncodedSpaceRE, ' ');
    return decodeURIComponent(str);
  },

  encode: function (str) {
    str = encodeURIComponent(str);
    // spec says space should be encoded as '+'
    return str.replace(encodedSpaceRE, '+');
  }

};

module.exports = URL;
