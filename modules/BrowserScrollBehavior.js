var createScrollBehavior = require('./createScrollBehavior');
var NavigationTypes = require('./NavigationTypes');

function restoreScrollPosition(location) {
  var { scrollPosition, navigationType } = location;

  if (navigationType === NavigationTypes.POP && scrollPosition != null) {
    window.scrollTo(scrollPosition.x, scrollPosition.y);
  } else {
    window.scrollTo(0, 0);
  }
}

module.exports = createScrollBehavior(restoreScrollPosition);