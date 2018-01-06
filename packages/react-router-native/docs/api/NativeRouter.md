# &lt;NativeRouter>

A [`<Router>`](../../../react-router/docs/api/Router.md) for iOS and Android apps built using [React Native](https://facebook.github.io/react-native/).

```jsx
import { NativeRouter } from 'react-router-native'

<NativeRouter>
  <App/>
</NativeRouter>
```

## getUserConfirmation: func

A function to use to confirm navigation.

```jsx
import { Alert } from 'react-native'

// This is the default behavior
const getConfirmation = (message, callback) => {
  Alert.alert('Confirm', message, [
    { text: 'Cancel', onPress: () => callback(false) },
    { text: 'OK', onPress: () => callback(true) }
  ])
}

<NativeRouter getUserConfirmation={getConfirmation}/>
```

## keyLength: number

The length of `location.key`. Defaults to 6.

```jsx
<NativeRouter keyLength={12}/>
```

## children: node

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.
