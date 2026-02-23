---
"@remix-run/react-router": patch
"react-router": patch
---

Fixed a security issue where the server-side router incorrectly matched malformed URLs containing excessive trailing slashes or backslashes (e.g., `/signin///////`, `/signin\\\\\\\`). The server now normalizes pathnames before route matching and redirects malformed URLs to their canonical form using a 308 Permanent Redirect. This prevents potential URL normalization bypass attacks and ensures consistent routing behavior.
