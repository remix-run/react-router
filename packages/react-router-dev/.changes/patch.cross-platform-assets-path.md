Fix cross-platform deployment issue where static assets return 404 when building on Windows and deploying to Linux

- Normalize `assetsBuildDirectory` to use POSIX-style paths (forward slashes) in both Framework Mode and RSC Framework Mode
- Ensures build artifacts are platform-independent and work correctly across Windows, Linux, and macOS