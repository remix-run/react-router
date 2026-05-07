Fix `request.signal` not aborting in loaders/actions when the client disconnects

- undici (Node.js's built-in fetch implementation) wraps the `AbortSignal` passed to the `Request` constructor. When the `Request` object is garbage collected, the wrapped signal stops working.
- This caused `request.signal` to never abort in long-lived server responses such as SSE (Server-Sent Events), because the intermediate `Request` objects created during request processing were GC'd before the response stream closed.
- Fixed by holding a reference to each `Request` on its own signal, preventing GC while the signal is in use.
