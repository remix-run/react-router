var createScrollBehavior = require('./createScrollBehavior');

function scrollToTop() {
  window.scrollTo(0, 0);
}

module.exports = createScrollBehavior(scrollToTop);