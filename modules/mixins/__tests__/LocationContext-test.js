var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var HashLocation = require('../../locations/HashLocation');
var HistoryLocation = require('../../locations/HistoryLocation');
var LocationContext = require('../LocationContext');

describe('LocationContext', function () {

  var App = React.createClass({
    mixins: [ LocationContext ],
    render: function () {
      return React.DOM.div();
    }
  });

  describe('when location="none"', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App({ location: 'none' })
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('has a null location', function () {
      expect(component.getLocation()).toBe(null);
    });
  });

  describe('when location="hash"', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App({ location: 'hash' })
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('uses HashLocation', function () {
      expect(component.getLocation()).toBe(HashLocation);
    });
  });

  describe('when location="history"', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App({ location: 'history' })
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('uses HistoryLocation', function () {
      expect(component.getLocation()).toBe(HistoryLocation);
    });
  });

});
