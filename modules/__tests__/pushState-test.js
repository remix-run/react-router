import expect from 'expect';
import React from 'react';
import resetHash from './resetHash';
import execSteps from './execSteps';
import Router from '../Router';
import Route from '../Route';

describe('pushState', function () {
  beforeEach(resetHash);

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
          this.history.pushState(null, '/home/hi:there');
        },
        function () {
          expect(this.state.location.pathname).toEqual('/home/hi:there');
        }
      ];

      var execNextStep = execSteps(steps, done);

      React.render((
        <Router onUpdate={execNextStep}>
          <Route path="/" component={Index}/>
          <Route path="/home/hi:there" component={Home}/>
        </Router>
      ), node, execNextStep);
    });
  });
});
