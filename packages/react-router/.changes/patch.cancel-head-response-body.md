Cancel the discarded response body for `HEAD` requests, so a resource route streaming a file no longer leaks its file descriptor

- Keep observing nested deferred promise rejections after cancelling a data response so they cannot crash the server
