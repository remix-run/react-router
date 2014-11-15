var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var Router = require('../../Router');
var ReactTestUtils = React.addons.TestUtils;
var Route = require('../Route');
var Link = require('../Link');
var TestLocation = require('../../locations/TestLocation');
var { Foo } = require('../../__tests__/testHandlers');
var { click } = React.addons.TestUtils.Simulate;

describe('A Link', function () {
  describe('with params and a query', function () {
    it('knows how to make its href', function () {
      var LinkHandler = React.createClass({
        render: function() {
          return <Link to="foo" params={{bar: 'baz'}} query={{qux: 'quux'}}>Link</Link>
        }
      });

      var routes = [
        <Route name="foo" path="foo/:bar" handler={Foo} />,
        <Route name="link" handler={LinkHandler} />
      ];

      var div = document.createElement('div');
      TestLocation.history = ['/link'];

      Router.run(routes, TestLocation, function(Handler) {
        React.render(<Handler/>, div, function() {
          var a = div.querySelector('a');
          expect(a.getAttribute('href')).toEqual('/foo/baz?qux=quux');
        });
      });
    });
  });

  describe('when its route is active', function () {
    it('has an active class name', function () {
      var LinkHandler = React.createClass({
        render: function() {
          return <Link
            to="foo"
            className="dontKillMe"
            activeClassName="highlight"
          >Link</Link>;
        }
      });

      var routes = <Route name="foo" handler={LinkHandler} />;
      var div = document.createElement('div');
      TestLocation.history = ['/foo'];

      Router.run(routes, TestLocation, function(Handler) {
        React.render(<Handler/>, div, function() {
          var a = div.querySelector('a');
          expect(a.className.split(' ').sort().join(' ')).toEqual('dontKillMe highlight');
        });
      });
    });
  });

  describe('when clicked', function() {
    it('calls a user defined click handler', function (done) {
      var LinkHandler = React.createClass({
        handleClick: function(event) {
          assert.ok(true);
          done();
        },

        render: function() {
          return <Link to="foo" onClick={this.handleClick}>Link</Link>;
        }
      });

      var routes = [
        <Route name="foo" handler={Foo} />,
        <Route name="link" handler={LinkHandler} />
      ];
      var div = document.createElement('div');
      TestLocation.history = ['/link'];

      Router.run(routes, TestLocation, function(Handler) {
        React.render(<Handler/>, div, function() {
          click(div.querySelector('a'));
        });
      });
    });

    it('transitions to the correct route', function (done) {
      var div = document.createElement('div');
      TestLocation.history = ['/link'];

      var LinkHandler = React.createClass({
        handleClick: function() {
          // just here to make sure click handlers don't prevent it from happening
        },

        render: function() {
          return <Link to="foo" onClick={this.handleClick}>Link</Link>;
        }
      });

      var routes = [
        <Route name="foo" handler={Foo} />,
        <Route name="link" handler={LinkHandler} />
      ];

      var steps = [];

      steps.push(function() {
        click(div.querySelector('a'), {button: 0});
      });

      steps.push(function() {
        expect(div.innerHTML).toMatch(/Foo/);
        done();
      });

      Router.run(routes, TestLocation, function(Handler) {
        React.render(<Handler/>, div, function() {
          steps.shift()();
        });
      });
    });

  });

});
