var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var ImitateBrowserBehavior = require('../../behaviors/ImitateBrowserBehavior');
var ScrollToTopBehavior = require('../../behaviors/ScrollToTopBehavior');
var ScrollContext = require('../ScrollContext');

describe('ScrollContext', function () {

  var App = React.createClass({
    mixins: [ ScrollContext ],
    render: function () {
      return React.DOM.div();
    }
  });

  describe('when scrollBehavior="none"', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App({ scrollBehavior: 'none' })
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('has a null scroll behavior', function () {
      expect(component.getScrollBehavior()).toBe(null);
    });

    it('does not throw when updating scroll position', function () {
      expect(function () {
        component.updateScroll('/');
      }).toNotThrow();
    });
  });

  describe('when using scrollBehavior="browser"', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App({ scrollBehavior: 'browser' })
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('uses ImitateBrowserBehavior', function () {
      expect(component.getScrollBehavior()).toBe(ImitateBrowserBehavior);
    });
  });

  describe('when using scrollBehavior="imitateBrowser"', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App({ scrollBehavior: 'imitateBrowser' })
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('uses ImitateBrowserBehavior', function () {
      expect(component.getScrollBehavior()).toBe(ImitateBrowserBehavior);
    });
  });

  describe('when scrollBehavior="scrollToTop"', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App({ scrollBehavior: 'scrollToTop' })
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('uses ScrollToTopBehavior', function () {
      expect(component.getScrollBehavior()).toBe(ScrollToTopBehavior);
    });
  });

});
