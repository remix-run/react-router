"use strict";

exports.__esModule = true;
var k = function k() {};

var createServerRenderContext = function createServerRenderContext() {
  var flushed = false;
  var redirect = null;
  var matchContexts = [
    /* { hasMissComponent: bool, matchesByIdentity: [] } */
  ];

  var setRedirect = flushed ? k : function (location) {
    if (!redirect) redirect = location;
  };

  var registerMatchContext = flushed ? k : function (matchesByIdentity) {
    return matchContexts.push({
      hasMissComponent: false,
      matchesByIdentity: matchesByIdentity
    }) - 1;
  };

  // We need to know there is a potential to miss, if there are no Miss
  // components under a Match, then we need to not worry about it
  var registerMissPresence = flushed ? k : function (index) {
    matchContexts[index].hasMissComponent = true;
  };

  var getResult = function getResult() {
    flushed = true;
    var missed = matchContexts.some(function (context, index) {
      return missedAtIndex(index);
    });

    return {
      redirect: redirect,
      missed: missed
    };
  };

  var missedAtIndex = function missedAtIndex(index) {
    var context = matchContexts[index];
    return context.matchesByIdentity.length === 0 && context.hasMissComponent;
  };

  return {
    setRedirect: setRedirect,
    registerMatchContext: registerMatchContext,
    registerMissPresence: registerMissPresence,
    getResult: getResult,
    missedAtIndex: missedAtIndex
  };
};

exports.default = createServerRenderContext;