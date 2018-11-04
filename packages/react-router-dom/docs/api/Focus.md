# &lt;Focus>

Provides a way for an application to add [focus management](https://developers.google.com/web/fundamentals/accessibility/focus/using-tabindex#managing_focus_at_the_page_level) after navigation for better accessibility.

```jsx
import { Focus } from 'react-router-dom'

<Focus>
  {ref => (
    <main tabIndex={-1} ref={ref}>
      {/* ... */}
    </main>
  )}
</Focus>
```

`Focus` uses a render prop to provide a `ref`. The `ref` should be passed to the element that will be focused.

In order for `Focus` to work, the component type for the focused element needs to either be natively focusable (like an `<input>` or a `<button>`) or be given a `tabIndex` of `-1`. If you do not do this, then the document's `<body>` will be focused instead.

Focusing a DOM element will give it an outline; you can style it with `outline: none;` to hide this outline.

**Note:** Only the element that is passed the `ref` should have the `outline: none;` style. A global `outline: none;` rule should **not** be used because it will make your application inaccessible to users who navigate the page using their keyboard.

```jsx
<Focus>
  {ref => (
    <main tabIndex={-1} ref={ref} style={{ outline: "none" }}>
      {/* ... */}
    </main>
  )}
</Focus>
```

## children: function

The `children` function will be called with a [`ref`](https://reactjs.org/docs/refs-and-the-dom.html) and should return valid React elements.

```jsx
<Focus>
  {ref => (
    <main tabIndex={-1} ref={ref}>
      {/* ... */}
    </main>
  )}
</Focus>
```

## preserve: bool

When `true`, if one of the focused element's children is already focused (e.g. uses `autofocus`), then the element will not steal the focus from the child. Defaults to `false`.

```jsx
<Focus preserve={true}>
  {ref => ...}
</Focus>
```

## preventScroll: bool

When `true`, the application will not scroll to the element when it is focused. Defaults to `false`.

**Note:** This is experimental functionality that does not work in all browsers.

```jsx
<Focus preventScroll={true}>
  {ref => ...}
</Focus>
```
