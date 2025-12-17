---
"@react-router/dev": patch
"react-router": patch
---

[UNSTABLE] Add a new `future.unstable_trailingSlashAwareDataRequests` flag to provide consistent behavior of `request.pathname` inside `middleware`, `loader`, and `action` functions on document and data requests when a trailing slash is present in the browser URL.

Currently, your HTTP and `request` pathnames would be as follows for `/a/b/c` and `/a/b/c/`

| URL `/a/b/c` | **HTTP pathname** | **`request.pathname`** |
| ------------ | ----------------- | ---------------------- |
| **Document** | `/a/b/c`          | `/a/b/c` ✅            |
| **Data**     | `/a/b/c.data`     | `/a/b/c` ✅            |

| URL `/a/b/c/` | **HTTP pathname** | **`request.pathname`** |
| ------------- | ----------------- | ---------------------- |
| **Document**  | `/a/b/c/`         | `/a/b/c/` ✅           |
| **Data**      | `/a/b/c.data`     | `/a/b/c` ⚠️            |

With this flag enabled, these pathnames will be made consistent though a new `_.data` format for client-side `.data` requests:

| URL `/a/b/c` | **HTTP pathname** | **`request.pathname`** |
| ------------ | ----------------- | ---------------------- |
| **Document** | `/a/b/c`          | `/a/b/c` ✅            |
| **Data**     | `/a/b/c.data`     | `/a/b/c` ✅            |

| URL `/a/b/c/` | **HTTP pathname**  | **`request.pathname`** |
| ------------- | ------------------ | ---------------------- |
| **Document**  | `/a/b/c/`          | `/a/b/c/` ✅           |
| **Data**      | `/a/b/c/_.data` ⬅️ | `/a/b/c/` ✅           |

This a bug fix but we are putting it behind an opt-in flag because it has the potential to be a "breaking bug fix" if you are relying on the URL format for any other application or caching logic.

Enabling this flag also changes the format of client side `.data` requests from `/_root.data -> /_.data` when navigating to `/` to align with the new format.
