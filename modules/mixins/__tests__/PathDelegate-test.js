var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Route = require('../../components/Route');
var PathDelegate = require('../PathDelegate');

describe('PathDelegate', function () {

  var App = React.createClass({
    mixins: [ PathDelegate ],
    render: function () {
      return React.DOM.div();
    }
  });

  describe('makePath', function () {
    describe('when there is a route with the given name', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App(null, 
            Route({ name: 'home', path: '/:username/home', handler: App })
          )
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('creates the correct path', function () {
        expect(component.makePath('home', { username: 'mjackson' })).toEqual('/mjackson/home');
      });
    });

    describe('when there is no route with the given name', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App()
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('creates the correct path', function () {
        expect(function () {
          component.makePath('home');
        }).toThrow('Unable to find a route named "home". Make sure you have a <Route name="home"> defined somewhere in your <Routes>');
      });
    });
  });

  describe('makeHref', function () {
    describe('when using "hash" location', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App({ location: 'hash' }, 
            Route({ name: 'home', handler: App })
          )
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('puts a # in front of the URL', function () {
        expect(component.makeHref('home')).toEqual('#/home');
      });
    });

    describe('when using "history" location', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App({ location: 'history' }, 
            Route({ name: 'home', handler: App })
          )
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('returns the correct URL', function () {
        expect(component.makeHref('home')).toEqual('/home');
      });
    });
  });

});
