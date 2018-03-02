# &lt;提示>

 用于在用户离开页面之前及时提示用户。当你的应用程序进入应阻止用户离开的状态时（比如一个表格被填满了一半），渲染一个 `<Prompt>` 。

```jsx
import { Prompt } from 'react-router'

<Prompt
  when={formIsHalfFilledOut}
  message="Are you sure you want to leave?"
/>
```

## message: 字符串

当用户试图离开时提示用户的消息。

```jsx
<Prompt message="Are you sure you want to leave?"/>
```

## message: 函数

将用户试图前往到的下一个 `Location` 和 `action` 调用。返回一个字符串以向用户显示提示符，或返回 `true` 以允许转换。

```jsx
<Prompt message={location => (
  location.pathname.startsWith('/app') ? true : `Are you sure you want to go to ${location.pathname}?`
)}/>
```

## when: 布尔值

你可以一直渲染而不是在警示框出现之后才渲染一个 `<Prompt>` ，但是可以通过 `when={true}` 或 `when={false}` 来阻止或允许相应的导航。

```jsx
<Prompt when={formIsHalfFilledOut} message="Are you sure?"/>
```
