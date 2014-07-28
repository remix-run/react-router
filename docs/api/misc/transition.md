API: `transition` (object)
==========================

This object is sent to the [transition hooks][transition-hooks] as the
first argument.

Methods
-------

### `abort()`

Aborts a transition.

### `redirect(to, params, query)`

Redirect to another route.

### `retry()`

Retrys a transition. Typically you save off a transition you care to
return to, finish the workflow, then retry.

  [transition-hooks]:/docs/api/components/RouteHandler.md#static-lifecycle-methods

