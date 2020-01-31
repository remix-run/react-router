## Matching trailing slashes

- Resource vs. UI
- "use slashes or don't, we don't care"
- you can always use a trailing slash in your link to, we won't change it
- if you care about *matching* a trailing slash and rendering some different UI (this is a UI concern) then you'll have to use a trailing * and check window.location.pathname yourself

## Relative URLs

On the web, you can *be at* either a "file" or a "directory". The URL can be `/file` or `/dir/`.

Relative URLs behave differently depending on where you are. So `<a href="./other">` will point to different places depending on whether you have a trailing slash in the current URL. When the current URL is `/file`, `./other` will link to `/other`. When it is `/dir/`, `./other` will link to `/dir/other`.

But on the command line, you're only ever in a directory; the "current working directory". You can get it with `pwd`. Paths always resolve relative to the current working directory.

React Router's `<Link to>` prop resolves like paths on the command line. This means that `<Link to="deeper">` will always append one more segment to the current URL, regardless of whether or not it has a trailing slash.

| Current URL                 | `<Link to>`                    | `<a href>`                           |
|-----------------------------|--------------------------------|--------------------------------------|
| /a/b                        | `<Link to="deeper">`           | `<a href="/a/b/deeper">`             |
| /a/b/                       | `<Link to="deeper">`           | `<a href="/a/b/deeper">`             |
| /a/b                        | `<Link to="../c">`             | `<a href="/a/c">`                    |

**This does not mean you cannot have trailing slashes in your URLs. It just means that we don't care whether you use a trailing slash or not.** Routes ignore the trailing slash when matching.

## Ryan's Thoughts

- When matching, we don't care about slashes
  - People putting trailing slashes in their `<Route path>` doesn't really seem like a problem.
    If they put it there, they probably meant it.
  - Redirecting from no-slash => slash (or vice versa) on a per-route basis is a little easier
    if people can specify a trailing slash in their `<Route path>`
- People need to worry about slashes, not to render two different things with a slash or not, but rather to make sure they don't have two URLs for the same thing, so we need to allow them to either use slashes, or not
  - We can do that on a per-route basis if we allow them to match trailing slash in their `<Route path>`
  - We can do it for all routes with a global config (like Firebase' `trailingSlash` hosting config)
- It is their job on the server to redirect from slash to no slash (or visa versa, whatever they choose)
  - Agree
- It is their job to link to urls with trailing slashes or not
  - Agree
- If they are using trailing slashes or not, our relative linking doesn't care, we treat foo/ and foo identically, just like cd but unlike resource URLs in HTML. We have a simpler concept of relativity.
  - If we don't ignore the trailing slash when matching, then it's already pretty easy to reason about how links work since you already know 100% which URL that link will be rendered at. If we ignore trailing slashes during matching, then it becomes a little more difficult because links could possibly be rendered at 2 different URLs.

## Michael's Thoughts

- Relativity in RR is 2 things: relative routes + relative links. In both cases, routes and links are relative to the route that rendered them.
- Trailing slashes:
  - People will want a global config to automatically strip the trailing slash, and it should maybe even be the default (Firebase hosting only uses trailing slashes for directory index files, but we don't have those)
  - Could maybe do `<Router removeTrailingSlashes={false}>` to disable
  - Could maybe also just do a `<Redirect from="*/" to="*">` to opt-in
  - Anecdote: I'm noticing a lot of sites don't even worry about 2 different URLs for the same page...
- Linking deeper:
  - Using a trailing slash in the parent route: `<Link to="deeper">`
  - Not using a trailing slash in the parent route: `<Link to="${match.url}/deeper">`
    - Maybe use a `<Link deeper="deeper">` API to avoid passing `match` around?
    - Jest uses a `<rootDir>` placeholder (i.e. `<rootDir>/the/path`)
    - Could also just pretend like all routes have a trailing `/` and work like `cd` does. The side effect is that you'll need to use `../` to link to a sibling (not really intuitive to me)
