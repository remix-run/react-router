# &lt;AndroidBackButton>

Connects the android global back button to the router's history. When the initial location is reached, the default android back behavior takes over. Just render one somewhere in your app.

```js
<AndroidBackButton/>
```

## children

If you want to avoid the floating configuration component, you can compose with children.

```js
<NativeRouter>
  <AndroidBackButton>
    <App/>
  </AndroidBackButton>
</NativeRouter>

// instead of
<NativeRouter>
  <View>
    <AndroidBackButton/>
    <View>Some people don't like that.</View>
  </View>
</NativeRouter>
```
