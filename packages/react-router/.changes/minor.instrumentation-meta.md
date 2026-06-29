Return route metadata from server request, client navigation, and client fetcher instrumentations

- Adds result metadata after instrumented calls complete, including the URL, matched route pattern, and params
- Adds known HTTP status codes to server request handler instrumentation results
