import expect from 'expect';
import React from 'react';
import createHistory from 'history/lib/createHashHistory';
import resetHash from './resetHash';
import execStepsWithDelay from './execStepsWithDelay';
import { getWindowScrollPosition } from '../DOMUtils';
import Router from '../Router';
import Route from '../Route';

describe.skip('ScrollManagementMixin', function () {
  var Home = React.createClass({
    render() {
      return <p style={{ padding: '100px 5000px 5000px 100px' }}>Yo, this page is huge.</p>;
    }
  });

  var Inbox = React.createClass({
    render() {
      return <p style={{ padding: '100px 5000px 5000px 100px' }}>Yo, this page is huge.</p>;
    }
  });

  beforeEach(resetHash);

  var node;
  beforeEach(function (done) {
    node = document.createElement('div');
    document.body.appendChild(node);
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
    document.body.removeChild(node);
  });

  it('correctly updates the window scroll position', function (done) {
    var steps = [
      function () {
        expect(this.state.location.pathname).toEqual('/');

        window.scrollTo(200, 200);
        expect(getWindowScrollPosition()).toEqual({ x: 200, y: 200 });

        this.transitionTo('/inbox');
      },
      function () {
        expect(this.state.location.pathname).toEqual('/inbox');
        expect(getWindowScrollPosition()).toEqual({ x: 0, y: 0 });

        this.goBack();
      },
      function () {
        expect(this.state.location.pathname).toEqual('/');
        expect(getWindowScrollPosition()).toEqual({ x: 200, y: 200 });
      }
    ];

    var execNextStep = execStepsWithDelay(steps, 10, done);

    // Needs scroll support in the history module
    // See https://github.com/rackt/history/issues/17
    var history = createHistory({
      getScrollPosition: getWindowScrollPosition
    });

    React.render((
      <Router history={history} onUpdate={execNextStep}>
        <Route path="/" component={Home}/>
        <Route path="/inbox" component={Inbox}/>
      </Router>
    ), node, execNextStep);
  });
});
