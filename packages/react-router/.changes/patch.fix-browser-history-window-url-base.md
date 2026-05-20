Fix browser URL creation to use the configured history window instead of the global window.

- Pass the history/router window through to `createBrowserURLImpl` so custom window contexts keep the correct URL origin.
