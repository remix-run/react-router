# &lt;BackButton>

Connects the global back button on Android and tvOS to the router's history. On Android, when the initial location is reached, the default back behavior takes over. Just render one somewhere in your app.

```js
<BackButton/>
```

## children

If you want to avoid the floating configuration component, you can compose with children.

```js
<NativeRouter>
  <BackButton>
    <App/>
  </BackButton>
</NativeRouter>

// instead of
<NativeRouter>
  <View>
    <BackButton/>
    <View>Some people don't like that.</View>
  </View>
</NativeRouter>
```
