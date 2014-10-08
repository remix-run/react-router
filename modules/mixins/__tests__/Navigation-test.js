var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Routes = require('../../components/Routes');
var Route = require('../../components/Route');
var Navigation = require('../Navigation');

describe('Navigation', function () {

  afterEach(require('../../stores/PathStore').teardown);

  var NavigationHandler = React.createClass({
    mixins: [ Navigation ],
    render: function () {
      return null;
    }
  });

  describe('makePath', function () {
    describe('when there is a route with the given name', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ initialPath: '/anybody/home' }, 
            Route({ name: 'home', path: '/:username/home', handler: NavigationHandler })
          )
        );
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
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ initialPath: '/home' },
            Route({ name: 'home', handler: NavigationHandler })
          )
        );
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
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'hash', initialPath: '/home' }, 
            Route({ name: 'home', handler: NavigationHandler })
          )
        );
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
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'history', initialPath: '/home' }, 
            Route({ name: 'home', handler: NavigationHandler })
          )
        );
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
