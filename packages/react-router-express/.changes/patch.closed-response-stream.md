Ignore writes after Express responses close

- Avoid surfacing client disconnects as adapter errors when the response stream has already been destroyed or ended.
