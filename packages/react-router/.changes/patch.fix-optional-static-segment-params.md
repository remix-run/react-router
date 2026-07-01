Fix incorrect dynamic param extraction when optional static segments are present

- When a route path contains optional static segments (e.g. `/school?/user/:id`), the internal regex's incorrectly shifted parameter indices resulting in incorrect parameter extraction
- Consecutive optional static segments (e.g. `/one?/two?`) were only partially handled
