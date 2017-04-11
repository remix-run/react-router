# Frequently Asked Questions

This is a list of support questions that frequently show up in GitHub issues. This list is intended to minimize the frequency of this happening. The issues section is intended for bug reports, not developer support. Support questions should be asked at StackOverflow or in the Reactiflux chat. 

If there is a support question that you frequently see being asked, please open a PR to add it to this list.

* [Why aren't my components updating when the location changes?](#why-arent-my-components-updating-when-the-location-changes)
* [Why doesn't my application render after refreshing?](#why-doesnt-my-application-render-after-refreshing)
* [Why doesn't my application work when loading nested routes?](#why-doesnt-my-application-work-when-loading-nested-routes)

### Why aren't my components updating when the location changes?

React Router relies on updates propagating from your router component to every child component. If you (or a component you use) implements `shouldComponentUpdate` or is a `React.PureComponent`, you may run into issues where your components do not update when the location changes. For a detailed review of the problem, please see the [blocked updates guide](packages/react-router/docs/guides/blocked-updates.md).

### Why doesn't my application render after refreshing?

If your application is hosted on a static file server, you need to use a `<HashRouter>` instead of a `<BrowserRouter>`.

```js
import { HashRouter } from 'react-router-dom'

ReactDOM.render((
  <HashRouter>
    <App />
  </HashRouter>
), holder)
```

When you load the root page of a website hosted on a static file server (e.g., `http://www.example.com`), a `<BrowserHistory>` might appear to work. However, this is only because when the browser makes the request for the root page, the server responds with the root `index.html` file.

If you load the application through the root page, in-app navigation will work because requests are not actually made to the server. This means that if you load `http://www.example.com` and click a link to `http://www.example.com/other-page/`, your application will match and render the `/other-page/` route.

However, you will end up with a blank screen if you were to refresh a non-root page (or just attempt to navigate directly to it). Opening up your browser's developer tools, you will see an error message in the console informing you that the page could not be loaded. This is because static file servers rely on the requested file actually existing.

```bash
# a request for http://www.example.com/other-page/ expects this to exist
.
|-- index.html
+-- other-page
    +-- index.html
```

This is not an issue when your server can respond to dynamic requests. In that situation, you can instruct the server to catch all requests and serve up the same `index.html` file.

```js
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'))
})
```

When you use a static server, your application should have just one `index.html` file.

```bash
.
|-- index.html # this is the only html file
+-- static
    |-- js
    |   +-- bundle.js
    +-- css
        +-- index.css
```

Then, you can use a hash history (created by a `<HashRouter>`) to encode the location in the URL's `hash` fragment. The pathname of the real url will always point to the same file on the server (e.g., both `http://www.example.com/#/` and `http://www.example.com/#/other-page` will load the root `index.html` file). This results in URLs that are not as pretty as the ones created when you use a `<BrowserRouter>`, but it is a necessary limitation of working with a static file server.

### Why doesn't my application work when loading nested routes?

If the `src` of the `<script>` tag that is used to load your application has a relative path, you will run into issues when loading your application from nested locations (e.g., `/parent` works, but `/parent/child` does not). All that you have to do to fix this is to ensure that the `src` path is absolute.

```html
<!-- good -->
<script src='/static/js/bundle.js'></script>
<!-- bad -->
<script src='static/js/bundle.js'></script>
<script src='./static/js/bundle.js'></script>
```
