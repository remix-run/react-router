var NavigationTypes = require('../NavigationTypes');

/**
 * A scroll behavior that attempts to imitate the default behavior
 * of modern browsers.
 */
var ImitateBrowserBehavior = {

  updateScrollPosition(position, navigationType) {
    switch (navigationType) {
      case NavigationTypes.PUSH:
      case NavigationTypes.REPLACE:
        window.scrollTo(0, 0);
        break;
      case NavigationTypes.POP:
        if (position) {
          window.scrollTo(position.x, position.y);
        } else {
          window.scrollTo(0, 0);
        }
        break;
    }
  }

};

module.exports = ImitateBrowserBehavior;
