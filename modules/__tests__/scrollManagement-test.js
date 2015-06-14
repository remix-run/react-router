import expect from 'expect';
import React, { render } from 'react';
import { HashHistory } from '../HashHistory';
import { getWindowScrollPosition } from '../DOMUtils';
import Router from '../Router';
import Route from '../Route';

describe('Scroll management', function () {
  var node, Home, Inbox;
  beforeEach(function (done) {
    node = document.createElement('div');
    document.body.appendChild(node);

    Home = React.createClass({
      render() {
        return (
          <div>
            {/* make it scroll baby */}
            <p style={{padding: '100px 3000px 3000px 100px'}}>Yo, this is the home page.</p>
          </div>
        );
      }
    });

    Inbox = React.createClass({
      render() {
        return <p>This is the inbox.</p>;
      }
    });

    window.location.hash = '/';

    // Give the DOM a little time to reflect the hashchange.
    setTimeout(done, 10);
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
    document.body.removeChild(node);
  });

  it('correctly updates the window scroll position', function (done) {
    var steps = [
      function () {
        expect(this.state.location.pathname).toEqual('/');
        window.scrollTo(100, 100);
        expect(getWindowScrollPosition()).toEqual({ scrollX: 100, scrollY: 100 });
        this.transitionTo('/inbox');
      },
      function () {
        expect(this.state.location.pathname).toEqual('/inbox');
        expect(getWindowScrollPosition()).toEqual({ scrollX: 0, scrollY: 0 });
        this.goBack();
      },
      function () {
        expect(this.state.location.pathname).toEqual('/');
        expect(getWindowScrollPosition()).toEqual({ scrollX: 100, scrollY: 100 });
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

    var history = new HashHistory({ queryKey: true });

    render((
      <Router history={history} onUpdate={execNextStep}>
        <Route path="/" component={Home}/>
        <Route path="inbox" component={Inbox}/>
      </Router>
    ), node, execNextStep);
  });
});
