Path Matching
=============

Relative v. Absolute Paths
--------------------------

Paths that start with `/` are absolute, paths that don't are relative,
meaning they extend their parent's path.

```xml
<Route path="/">
  <!-- /courses/123 -->
  <Route path="courses/:courseId">
    <!-- /courses/123/anouncements -->
    <Route path="announcements" />
    <!-- /courses/123/dashboard -->
    <Route path="dashboard" />
  </Route>
  <!-- /inbox -->
  <Route path="inbox">
    <!-- /messages/123 -->
    <Route path="/messages/:messageId"/>
  </Route>
</Route>
```

Absolute paths allow you to use any URL you want while maintaining the
automatic view nesting of the router.

Dynamic Segments
----------------

Dynamic segments are defined with a `:`, like `:userId`. They will be
parsed and available by name in your route handler on
`this.props.params`. They match most characters except `/ ? #`.

Splats
------

Splats are defined with `*` and will non-greedily match anything. The
value will be available in your route handler as
`this.props.params.splat`. If there are multiple, you'll get an array of
values.

Question Mark
-------------

Question marks will optionally match the preceding segment.

Examples
--------

```
path: /file/:name
matches:
  /file/foo.js
    this.props.params: {name: 'foo.js'}
does not match:
  /file/quux/baz.gif
  /file/
  /file

path: /file/:name?
matches:
  /file/foo.js
    this.props.params: {name: 'foo.js'}
  /file/
    this.props.params: {}
does not match:
  /file
  /file/quux/baz.js

path: /file/?:name?
matches:
  /file/foo.js
    this.props.params: {name: 'foo.js'}
  /file/
    this.props.params: {}
  /file
    this.props.params: {}
does not match:
  /file/quux/baz.js

path: /file/*
matches:
  /file/foo.js
    this.props.params: {splat: 'foo.bar.js'}
  /file/quux/baz.js
    this.props.params: {splat: 'quux/baz.js'}

path: /foo/*/:bar/?*?
matches:
  /foo/a.b.c/taco/def
    this.props.params: {bar: 'taco', splat: ['a.b.c', 'def']}
  /foo/a.b.c/taco
    this.props.params: {bar: 'taco', splat: 'a.b.c'}
does not match:
  /foo/a.b.c

path: *
matches everything, but you probably want `<NotFoundRoute/>`
```

