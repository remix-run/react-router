# Prompt

Used to prompt the user before navigating away from a page. When your application enters a state that should prevent the user from navigating away (like a form is half-filled out), render a `<Prompt>`.

```js
<Prompt
  when={formIsHalfFilledOut}
  message="Are you sure you want to leave?"
/>
```

## message: string _Prompt_

The message to prompt the user with when they try to navigate away.

```js
<Prompt message="Are you sure you want to leave?"/>
```

## message: func _Prompt_

Will be called with the next `location` and `action` the user is attempting to navigate to. Return a string to show a prompt to the user or `true` to allow the transition.

```js
<Prompt message={location => (
  `Are you sure you want to go to ${location.pathname}?`
)}/>
```

## when: bool _Prompt_

Instead of conditionally rendering a `<Prompt>` behind a guard, you can always render it but pass `when={true}` or `when={false}` to prevent or allow navigation accordingly.

```js
<Prompt when={formIsHalfFilledOut} message="Are you sure?"/>
```

## beforeUnload: bool _Prompt_
Prevent user for navigating away from the site. Prompt user to warn 
about leaving the site.

```js
<Prompt beforeUnload={false} />
```

## beforeUnload: func _Prompt_
Prevent user for navigating away from the site. Perform custom actions, 
for example clean up code before prompting the user.

```js
<Prompt beforeUnload={() { 
  console.log("custom action")
  var dialogText = "Changes you made may not be saved."
  e.returnValue = dialogText
  return dialogText
}} />
```