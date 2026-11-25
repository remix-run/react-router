Align `createMemoryHistory().createURL()` with browser and static history URL creation

- Treat leading `//` and `\\` as path separators instead of a protocol-relative host, so data routers in memory environments build loader/action request URLs with the expected pathname
