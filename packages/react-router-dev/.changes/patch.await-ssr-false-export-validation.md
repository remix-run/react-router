Fix dev server crash when a route has an invalid export with `ssr: false` + `prerender`

- The export validation was not awaited, so its error became an unhandled rejection that exited the process. It now surfaces as a Vite error and the dev server keeps running.
