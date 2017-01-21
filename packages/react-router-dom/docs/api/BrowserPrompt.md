# BrowserPrompt

Used to prompt the user before navigating away from a site. When your application enters a state that should prevent the user from navigating away (like a form is half-filled out), render a `<BrowserPrompt>`. 
This component wraps other features provided by Prompt.

## beforeUnload: bool _Prompt_
Prevent user for navigating away from the site. Prompt user to warn 
about leaving the site.

```js
<Prompt beforeUnload={true} />
```