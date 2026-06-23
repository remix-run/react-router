Return route metadata from server request and client navigation instrumentations

- Adds result metadata after instrumented calls complete, including the URL,
  matched route pattern, and params.
- Adds known HTTP status codes to server request handler instrumentation results.
