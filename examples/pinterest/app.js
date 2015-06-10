import React from 'react';
import { Router, Link, HashHistory } from 'react-router';

var pictures = [
  {id: 0, src: 'http://placekitten.com/601/601'},
  {id: 1, src: 'http://placekitten.com/610/610'},
  {id: 2, src: 'http://placekitten.com/620/620'},
];

var App = React.createClass({
  render () {
    return (
      <div>
        <h1>Pinterest Style Routes</h1>
        <p>
          The url `/pictures/:id` can potentially match two routes,
          it all depends on if the url was navigated to from the feed or
          not.
        </p>
        <p>
          Click on an item in the feed, and see that it opens in an overlay.
          Then copy/paste it into a different browser window (Like Chrome -> Firefox),
          and see that the image does not render inside the overlay. One URL, two
          session dependent routes and UI :D
        </p>

        {this.props.children}
      </div>
    );
  }
});

var Feed = React.createClass({

  overlayStyles: {
    position: 'fixed',
    top: 30,
    right: 30,
    bottom: 30,
    left: 30,
    padding: 20,
    boxShadow: '0px 0px 50px 30px rgba(0, 0, 0, 0.5)',
    overflow: 'auto',
    background: '#fff'
  },

  render () {
    return (
      <div>
        <div>
          {pictures.map(picture => (
            <Link
              to={`/pictures/${picture.id}`}
              state={{fromFeed: true}}
            >
              <img style={{margin: 10}} src={picture.src} height="100"/>
            </Link>
          ))}
        </div>
        {this.props.children && (
          <div style={this.overlayStyles}>
            {this.props.children}
          </div>
        )}
      </div>
    );
  }
});

var FeedPicture = React.createClass({
  render () {
    return (
      <div>
        <h2>Inside the feed</h2>
        <Link to="/">back</Link>
        <p>
          <img src={pictures[this.props.params.id].src} height="400"/>
        </p>
      </div>
    );
  }
});

var Picture = React.createClass({
  render () {
    return (
      <div>
        <h2>Not Inside the feed</h2>
        <Link to="/">Feed</Link>
        <p>
          <img src={pictures[this.props.params.id].src}/>
        </p>
      </div>
    );
  }
});

var FeedPictureRoute = {
  path: '/pictures/:id',
  component: FeedPicture
};

var FeedRoute = {
  component: Feed,
  childRoutes: [ FeedPictureRoute ],
};

var PictureRoute = {
  path: '/pictures/:id',
  component: Picture
};

var RootRoute = {
  path: '/',

  component: App,

  indexRoute: FeedRoute,

  getChildRoutes (state, cb) {
    if (state.fromFeed) {
      cb(null, [ FeedRoute ]);
    }
    else {
      cb(null, [ PictureRoute ]);
    }
  }
};

React.render(
  <Router history={HashHistory} children={RootRoute}/>,
  document.getElementById('example')
);

// Wait a sec ... what's happening?
//
//  1. When you visit "/" `RootRoute.indexRoute` is matched,
//     which is `FeedRoute`, and that renders `Feed`.
//
//  2. Then, when you click a link on the feed, it sets some location `state`,
//     particularly, `fromFeed`.
//
//  3. The router calls `RootRoute.getChildRoutes` while matching, which
//     branches on `transitionState.fromFeed` and calls back with only
//     `FeedRoute` as a child, so `PictureRoute` has no chance of ever matching.
//
//  4. `FeedRoute` has no path, so the router will dig down into its children
//     to try to find a match, and finds `FeedPictureRoute` as a match.
//
//  5. The components `App -> Feed -> FeedPicture` all render.
//
//  6. Hit refresh in the browser.
//
//  7. The url is not `/` so `RootRoute.defaultRoute` does not get matched.
//
//  8. Since there is no `transitionState`, `RootRoute.getChildRoutes` branches
//     the other way, and callsback with `PictureRoute` as a child, which matches
//     the url.
//
//  9. `App -> PictureRoute` renders
//
// 10. I am very glad there aren't ten steps to explain this ...
//

