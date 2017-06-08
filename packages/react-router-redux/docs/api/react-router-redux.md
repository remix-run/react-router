## ConnectedRouter
ConnectedRouter listens to a history object passed from props. When history is changed, it dispatches a `LOCATION-CHANGE` action to the redux store. Then, store will pass props to component to render. This creates uni-directional flow from history -> store -> router -> components.

## routerMiddleware: (history) => middlewareFn
Takes in a history of your choosing (i.e. browser history) and returns a middleware to be applied when creating the redux store.

This middleware captures `CALL_HISTORY_METHOD` actions and redirects them to the provided history object. This will prevent these actions from reaching your reducer or any middleware that comes after this one.


## routerReducer: (previousLocation, action) => newLocation
A reducer that responds to `LOCATION_CHANGE` actions - see below.

This reducer will update the state with the most recent location to which history has transitioned. See the [`location`](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/location.md) docs for more information.

This state may not be in sync with the router, particularly if you have asynchronously-loaded routes, so reading from and relying on this state is discouraged.

## Actions
### Action Types

#### CALL_HISTORY_METHOD: string
This action type will be dispatched by the history actions below. If you're writing a middleware to watch for navigation events, be sure to look for actions of this type.

#### LOCATION_CHANGE: string
This action type will be dispatched when your history receives a location change. If `routerReducer` is used, it will update the associated state in your store to the new location when `LOCATION_CHANGE` actions are dispatched by the `ConnectedRouter`.

### Action Creators
These action creators return actions of type `CALL_HISTORY_METHOD` correspond to the history API. The associated routerMiddleware will capture these events before they get to your reducer and reissue them as the matching function on your history.

See the [`history`](https://github.com/ReactTraining/history#navigation) docs for more information on these functions.

#### push: (path, [state]) => action
Pushes a new entry onto the history stack

#### replace: (path, [state]) => action
Replaces the current entry on the history stack

#### go: n => action
Moves the pointer in the history stack by n entries

#### goBack: () => action
Equivalent to go(-1)

#### goForward: () => action
Equivalent to go(1)
