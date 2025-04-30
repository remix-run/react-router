---
"react-router": patch
---

Remove `Navigator` declaration for `navigator.connection.saveData` to avoid messing with any other types beyond `saveData` in userland
