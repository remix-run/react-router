# Scroll Restoration

In earlier versions of React Router we provided out-of-the-box support for scroll restoration and people have been asking for it ever since. Hopefully this document helps you get what you need out of the scroll bar and routing!

Browsers are starting to handle scroll restoration with `history.pushState` on their own in the same manner they handle it with normal browser navigation. It already works in chrome and it's really great. [Here's the Scroll Restoration Spec](https://majido.github.io/scroll-restoration-proposal/history-based-api.html#web-idl).

Because browsers are starting to handle the "default case" and apps have varying scrolling needs (like this website!), we don't ship with default scroll management. This guide should help you implement whatever scrolling needs you have.

## Scroll to top

Most of the time all you need is to "scroll to the top" because you have a long content page, that when navigated to, stays scrolled down. This is straightforward to handle with a `<ScrollToTop>` component that will scroll the window up on every navigation, make sure to wrap it in `withRouter` to give it access to the router's props:

```jsx
class ScrollToTop extends Component {
  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    return this.props.children;
  }
}

export default withRouter(ScrollToTop);
```

Then render it at the top of your app, but below Router

```jsx
function App() {
  return (
    <Router>
      <ScrollToTop>
        <App />
      </ScrollToTop>
    </Router>
  );
}

// or just render it bare anywhere you want, but just one :)
<ScrollToTop />;
```

If you have a tab interface connected to the router, then you probably don't want to be scrolling to the top when they switch tabs. Instead, how about a `<ScrollToTopOnMount>` in the specific places you need it?

```jsx
class ScrollToTopOnMount extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
  }

  render() {
    return null;
  }
}

class LongContent extends Component {
  render() {
    <div>
      <ScrollToTopOnMount />
      <h1>Here is my long content page</h1>
    </div>;
  }
}

// somewhere else
<Route path="/long-content" component={LongContent} />;
```

## Generic Solution

For a generic solution (and what browsers are starting to implement natively) we're talking about two things:

1. Scrolling up on navigation so you don't start a new screen scrolled to the bottom
2. Restoring scroll positions of the window and overflow elements on "back" and "forward" clicks (but not Link clicks!)

At one point we were wanting to ship a generic API. Here's what we were headed toward:

```jsx
<Router>
  <ScrollRestoration>
    <div>
      <h1>App</h1>

      <RestoredScroll id="bunny">
        <div style={{ height: "200px", overflow: "auto" }}>I will overflow</div>
      </RestoredScroll>
    </div>
  </ScrollRestoration>
</Router>
```

First, `ScrollRestoration` would scroll the window up on navigation. Second, it would use `location.key` to save the window scroll position _and_ the scroll positions of `RestoredScroll` components to `sessionStorage`. Then, when `ScrollRestoration` or `RestoredScroll` components mount, they could look up their position from `sessionsStorage`.

What got tricky for me was defining an "opt-out" API for when I didn't want the window scroll to be managed. For example, if you have some tab navigation floating inside the content of your page you probably _don't_ want to scroll to the top (the tabs might be scrolled out of view!).

When I learned that chrome manages scroll position for us now, and realized that different apps are going to have different scrolling needs, I kind of lost the belief that we needed to provide something--especially when people just want to scroll to the top (which you saw is straight-forward to add to your app on your own).

Based on this, we no longer feel strongly enough to do the work ourselves (like you we have limited time!). But, we'd love to help anybody who feels inclined to implement a generic solution. A solid solution could even live in the project. Hit us up if you get started on it :)
