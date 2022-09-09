---
title: Picking a Router
order: 1
new: true
---

# Picking a Router

<form action="/foo">
  <input type="text"  formAction="/bar" />
</form>

<docs-warning>This doc is a work in progress and will be completed when the server rendering APIs around data loading are stable</docs-warning>

React Router ships with several "routers" depending on the environment you're app is running in and the use cases you have. This document should help you figure out which one to use.

- We recommend using [DataBrowserRouter][databrowserrouter] for all web projects. It keeps your UI and data in sync with the URL.
- For testing, you'll want to use [MemoryRouter][memoryrouter]
- For React Native apps, use [NativeRouter][nativerouter]

[databrowserrouter]: ./data-browser-router
[staticrouter]: ./static-router
[memoryrouter]: ./memory-router
[nativerouter]: ./native-router
