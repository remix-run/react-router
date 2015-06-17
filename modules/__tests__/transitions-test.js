import expect from 'expect';
import React, { render } from 'react';
import MemoryHistory from '../MemoryHistory';
import Router from '../Router';
import Route from '../Route';

describe('transitionTo', function () {
  var node;
  beforeEach(function () {
    node = document.createElement('div');
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
  });

  describe('when the target path contains a colon', function () {
    it('works', function (done) {
      var Index = React.createClass({
        render() {
          return <h1>Index</h1>;
        }
      });

      var Home = React.createClass({
        render() {
          return <h1>Home</h1>;
        }
      });

      var steps = [
        function () {
          expect(this.state.location.pathname).toEqual('/');
          this.transitionTo('/home/hi:there');
        },
        function () {
          expect(this.state.location.pathname).toEqual('/home/hi:there');
          done();
        }
      ];

      function execNextStep() {
        try {
          steps.shift().apply(this, arguments);
        } catch (error) {
          done(error);
        }
      }

      render((
        <Router history={new MemoryHistory('/')} onUpdate={execNextStep}>
          <Route path="/" component={Index}/>
          <Route path="/home/hi:there" component={Home}/>
        </Router>
      ), node, execNextStep);
    });
  });
});
