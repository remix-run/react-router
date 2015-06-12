import expect from 'expect';
import React, { createClass, renderToString } from 'react';
import Location from '../Location';
import Router from '../Router';

describe('Server rendering', function () {
  var Dashboard, NewsFeed, Inbox, DashboardRoute, NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute, routes;
  beforeEach(function () {
    Dashboard = createClass({
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
            {this.props.children}
          </div>
        );
      }
    });
  
    NewsFeed = createClass({
      render() {
        return <div>News</div>;
      }
    });
  
    Inbox = createClass({
      render() {
        return <div>Inbox</div>;
      }
    });
  
    NewsFeedRoute = {
      path: 'news',
      component: NewsFeed
    };
  
    InboxRoute = {
      path: 'inbox',
      component: Inbox
    };

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(nextState, transition) {
        transition.to('/inbox');
      }
    };

    MessageRoute = {
      path: 'messages/:messageID'
    };
  
    DashboardRoute = {
      component: Dashboard,
      getChildRoutes(locationState, callback) {
        setTimeout(function () {
          callback(null, [ NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute ]);
        }, 0);
      }
    };

    routes = [
      DashboardRoute
    ];
  });
  
  it('works', function (done) {
    var location = new Location('/inbox');

    Router.match(routes, location, function (error, transition, state) {
      var string = renderToString(<Router {...state}/>);
      expect(string).toMatch(/Dashboard/);
      expect(string).toMatch(/Inbox/);
      done();
    });
  });

});
