Uses the hash (`#`) portion of the URL.

For example, your urls will look like this:
`https://example.com/#/courses/123`.

This is the default location used in `Router.run` because it will always
work, though we recommend you configure your server and use
`HistoryLocation`.

Query Params
------------

Query params in the portion of the URL before the `#` are completely
ignored with `HashLocation` because they are not part of the URL that
`HashLocation` manages. Query parameters after the `#` will work as
expected.

For example: ` http://example.com/?lang=es#/messages?sort=date`,
`lang=es` is invisible to a `HashLocation` router, but `sort=date` is
recognized, and will be used as the query parameters.

