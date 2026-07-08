Fix dynamic param extraction for routes with optional static segments

- When a route path contains optional static segments (e.g. `/school?/user/:id`), the internal regex's incorrectly shifted parameter indices resulting in incorrect parameter extraction
- Consecutive optional static segments (e.g. `/one?/two?`) were only partially handled
