# Do not clone request

Date: 2022-05-13

Status: accepted

## Context

To allow multiple loaders / actions to read the body of a request, we have been cloning the request before forwarding it to user-code. This is not the best thing to do as some runtimes will begin buffering the body to allow for multiple consumers. It also goes against "the platform" that states a request body should only be consumed once.

## Decision

Do not clone requests before they are passed to user-code (actions, handleDocumentRequest, handleDataRequest), and remove body from request passed to loaders. Loaders should be thought of as a "GET" / "HEAD" request handler. These request methods are not allowed to have a body, therefore you should not be reading it in your Remix loader function.

## Consequences

Loaders always receive a null body for the request.

If you are reading the request body in both an action and handleDocumentRequest or handleDataRequest this will now fail as the body will have already been read. If you wish to continue reading the request body in multiple places for a single request against recommendations, consider using `.clone()` before reading it; just know this comes with tradeoffs.
