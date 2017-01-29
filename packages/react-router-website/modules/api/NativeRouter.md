# &lt;NativeRouter> {id=nativerouter}

A [`<Router>`](#router) for native iOS and Android apps built using [React Native](https://facebook.github.io/react-native/).

```js
import { NativeRouter } from 'react-router-native'

<NativeRouter>
  <App/>
</NativeRouter>
```

## getUserConfirmation: func _`<NativeRouter>`_ {id=nativerouter.getuserconfirmation}

A function to use to confirm navigation. Defaults to using [`window.confirm`](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm).

```js
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

## keyLength: number _`<NativeRouter>`_ {id=nativerouter.keylength}

The length of `location.key`. Defaults to 6.

```js
<NativeRouter keyLength={12}/>
```

## children: node _`<NativeRouter>`_ {id=nativerouter.children}

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.
