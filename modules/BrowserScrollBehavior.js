var createScrollBehavior = require('./createScrollBehavior');

function restoreScrollPosition(scrollPosition) {
  if (scrollPosition) {
    window.scrollTo(scrollPosition.x, scrollPosition.y);
  } else {
    window.scrollTo(0, 0);
  }
}

module.exports = createScrollBehavior(restoreScrollPosition);