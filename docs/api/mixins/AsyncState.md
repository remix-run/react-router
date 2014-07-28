API: `AsyncState` (mixin)
=========================

A mixin for route handlers that fetch at least part of their state
asynchronously.

Static Lifecycle Methods
------------------------

### `getInitialAsyncState(params, query, setState)`

Fetches state for a component after it mounts. Much like the familiar
`getInitialState` method, `getInitialAsyncState` should return a hash of
key/value pairs to use in the component's state.  The difference is that
the values may be promises. As these values resolve, the component's
state is updated.

#### Parameters

##### params (object)

The url parameters.

##### query (object)

The url query parameters

##### setState (function)

A function that can be used to `setState` as it is received, useful for
things like `xhr` progress and streamed data. Typically you won't use
this.

Props
-----

### `initialAsyncState`

When testing, use the `initialAsyncState` prop to simulate asynchronous
data fetching. When this prop is present, no attempt is made to retrieve
additional state via `getInitialAsyncState`.

Examples
--------

In it simplest form, just return a hash of promises, they become state:

```js
var User = React.createClass({
  mixins: [ Router.AsyncState ],
 
  statics: {
    getInitialAsyncState: function (params, query, setState) {
      return {
        user: fetchUser(params.userId),
        activity: fetchActivityForUser(params.userId)
      }
    }
  },

  render: function() {
    return this.state.user ?
      <LoadingUserProfile/> :
      <UserProfile user={this.state.user} activity={this.state.activity} />;
  }
});
```

But you can get fancier...

```js
var User = React.createClass({
  mixins: [ Router.AsyncState ],
 
  statics: {
    getInitialAsyncState: function (params, query, setState) {
      var buffer = '';

      return {
        user: getUserByID(params.userID) // may be a promise
        activity: {}, // an immediate value (not a promise)
        stream: getStreamingData(params.userID, function (chunk) {
          // `getStreamingData` returns a promise, but also calls back as
          // data is received, giving use a chance to update the UI with
          // progress
          buffer += chunk;
          setState({ streamBuffer: buffer });
        })
      };
    }
  },
 
  getInitialState: function () {
    return {
      user: null,        // Receives a value when getUserByID resolves.
      stream: null,      // Receives a value when getStreamingData resolves.
      streamBuffer: ''   // Used to track data as it loads.
    };
  },
 
  render: function () {
    if (!this.state.user)
      return <LoadingUser/>;
 
    return (
      <div>
        <p>Welcome {this.state.user.name}!</p>
        <p>So far, you've received {this.state.streamBuffer.length} data!</p>
      </div>
    );
  }
});
```

