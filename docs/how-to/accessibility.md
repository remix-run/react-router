---
title: Accessibility
---

# Accessibility

Accessibility in a React Router app looks a lot like accessibility on the web in general. Using proper semantic markup and following the [Web Content Accessibility Guidelines (WCAG)][wcag] will get you most of the way there.

React Router makes certain accessibility practices the default where possible and provides APIs to help where it's not.

## Links

[MODES: framework, data, declarative]

<br/>
<br/>

The [`<Link>` component][link] renders a standard anchor tag, meaning that you get its accessibility behaviors from the browser for free!

React Router also provides the [`<NavLink/>`][navlink] which behaves the same as `<Link>`, but it also provides context for assistive technology when the link points to the current page. This is useful for building navigation menus or breadcrumbs.

## Routing

[MODES: framework]

<br/>
<br/>

If you are rendering [`<Scripts>`][scripts] in your app, there are some important things to consider to make client-side routing more accessible for your users.

With a traditional multi-page website we don't have to think about route changes too much. Your app renders an anchor tag, and the browser handles the rest. If your users disable JavaScript, your React Router app should already work this way by default!

When the client scripts in React Router are loaded, React Router takes control of routing and prevents the browser's default behavior. React Router doesn't make any assumptions about your UI as the route changes. There are some important features you'll want to consider as a result, including:

- **Focus management:** What element receives focus when the route changes? This is important for keyboard users and can be helpful for screen-reader users.
- **Live-region announcements:** Screen-reader users also benefit from announcements when a route has changed. You may want to also notify them during certain transition states depending on the nature of the change and how long loading is expected to take.

In 2019, [Marcy Sutton led and published findings from user research][marcy-sutton-led-and-published-findings-from-user-research] to help developers build accessible client-side routing experiences.

[link]: ../api/components/Link
[navlink]: ../api/components/NavLink
[scripts]: ../api/components/Scripts
[wcag]: https://www.w3.org/WAI/standards-guidelines/wcag/
[marcy-sutton-led-and-published-findings-from-user-research]: https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing
