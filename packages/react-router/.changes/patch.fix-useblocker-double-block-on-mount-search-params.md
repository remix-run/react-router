Fix `useBlocker` blocking a second time when the destination route updates search params on mount

- The blocker function is now registered with the router in a layout effect, so a navigation started from another component's mount effect is never checked against a stale blocker function
