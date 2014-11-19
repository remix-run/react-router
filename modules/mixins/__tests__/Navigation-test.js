var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Routes = require('../../components/Routes');
var Route = require('../../components/Route');
var Navigation = require('../Navigation');

describe('Navigation', function () {

  var NavigationHandler = React.createClass({
    mixins: [ Navigation ],
    render: function () {
      return null;
    }
  });

  describe('makePath', function () {
    describe('when there is a route with the given name', function () {
      var component;
      beforeEach(function (done) {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'none', onChange: done }, 
            Route({ name: 'home', path: '/:username/home', handler: NavigationHandler })
          )
        );

        component.dispatch('/anybody/home', function (error, abortReason, nextState) {
          expect(error).toBe(null);
          expect(abortReason).toBe(null);
          component.setState(nextState, done);
        });
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('creates the correct path', function () {
        var activeComponent = component.getActiveComponent();
        assert(activeComponent);
        expect(activeComponent.makePath('home', { username: 'mjackson' })).toEqual('/mjackson/home');
      });
    });

    describe('when there is no route with the given name', function () {
      var component;
      beforeEach(function (done) {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'none' },
            Route({ name: 'home', handler: NavigationHandler })
          )
        );

        component.dispatch('/home', function (error, abortReason, nextState) {
          expect(error).toBe(null);
          expect(abortReason).toBe(null);
          component.setState(nextState, done);
        });
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('creates the correct path', function () {
        var activeComponent = component.getActiveComponent();
        assert(activeComponent);

        expect(function () {
          activeComponent.makePath('about');
        }).toThrow('Unable to find a route named "about". Make sure you have a <Route name="about"> defined somewhere in your <Routes>');
      });
    });
  });

  describe('makeHref', function () {
    describe('when using "hash" location', function () {
      var component;
      beforeEach(function (done) {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'hash' }, 
            Route({ name: 'home', handler: NavigationHandler })
          )
        );

        component.dispatch('/home', function (error, abortReason, nextState) {
          expect(error).toBe(null);
          expect(abortReason).toBe(null);
          component.setState(nextState, done);
        });
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('puts a # in front of the URL', function () {
        var activeComponent = component.getActiveComponent();
        assert(activeComponent);
        expect(activeComponent.makeHref('home')).toEqual('#/home');
      });
    });

    describe('when using "history" location', function () {
      var component;
      beforeEach(function (done) {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'history' }, 
            Route({ name: 'home', handler: NavigationHandler })
          )
        );

        component.dispatch('/home', function (error, abortReason, nextState) {
          expect(error).toBe(null);
          expect(abortReason).toBe(null);
          component.setState(nextState, done);
        });
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('returns the correct URL', function () {
        var activeComponent = component.getActiveComponent();
        assert(activeComponent);
        expect(activeComponent.makeHref('home')).toEqual('/home');
      });
    });
  });

});
