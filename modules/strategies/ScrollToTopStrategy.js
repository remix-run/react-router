var ScrollToTopStrategy = {

  getScrollPosition: function () {
    return { x: 0, y: 0 };
  },

  toString: function () {
    return '<ScrollToTopStrategy>';
  }

};

module.exports = ScrollToTopStrategy;