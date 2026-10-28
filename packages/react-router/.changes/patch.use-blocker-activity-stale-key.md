Stop `useBlocker` from re-registering a deleted blocker when its component is hidden and shown again with `<Activity>`

- Avoid an orphaned blocker silently blocking navigation (and the "A router only supports one blocker at a time" warning) after the component is hidden again
