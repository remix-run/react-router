Simply scrolls the browser to the top of the page on every transition so
that users aren't left at the bottom of a page after clicking a link.

### Example

```js
var AppRouter = Router.create({
  scrollBehavior: Router.ScrollToTopBehavior
  //...
});
```

