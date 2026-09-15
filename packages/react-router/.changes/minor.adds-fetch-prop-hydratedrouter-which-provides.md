Adds a `fetch` prop to `HydratedRouter`, which provides a custom fetch implementation for manifest and data requests. The function receives context identifying the operation that initiated each request and the key of any fetcher being loaded.

Custom `dataStrategy` implementations also receive an `initiator` identifying initialization, navigation, fetcher, revalidation, and static handler executions.
