/** @jsx React.DOM */

var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Router = require('../../Router');
var Route = require('../Route');
var RouteHandler = require('../RouteHandler');

describe('RouteHandler', function () {

  it('accepts properties');

  it('renders after an update', function (done) {
    var Nested = React.createClass({
      componentDidMount: function () {
        this.forceUpdate(finishTest);
      },
      render: function () {
        return (
          <div>
            hello
            <RouteHandler />
          </div>
        );
      }
    });

    var Foo = React.createClass({
      render: function () {
        return <div>foo</div>;
      }
    });

    var routes = (
      <Route path='/' handler={Nested}>
        <Route path='foo' handler={Foo}/>
      </Route>
    );

    var div = document.createElement('div');

    Router.run(routes, '/foo', function (App) {
      React.render(<App />, div);
    });

    function finishTest() {
      expect(div.innerHTML).toMatch(/hello/);
      expect(div.innerHTML).toMatch(/foo/);
      done();
    }
  });

});



