import expect from 'expect';
import React from 'react';
import createHistory from 'history/lib/createHashHistory';
import resetHash from './resetHash';
import execSteps from './execSteps';
import Router from '../Router';
import Route from '../Route';

describe('transitionTo', function () {
  beforeEach(resetHash);

  var node;
  beforeEach(function () {
    node = document.createElement('div');
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
  });

  describe.skip('when the target path contains a colon', function () {
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
        }
      ];

      var execNextStep = execSteps(steps, done);
      var history = createHistory();

      React.render((
        <Router history={history} onUpdate={execNextStep}>
          <Route path="/" component={Index}/>
          <Route path="/home/hi:there" component={Home}/>
        </Router>
      ), node, execNextStep);
    });
  });
});
