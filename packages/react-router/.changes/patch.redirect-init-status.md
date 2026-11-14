Stop `redirect()`, `redirectDocument()` and `replace()` from setting `status: 302` on the `ResponseInit` passed to them

- Later responses created from the same init object no longer get status 302, and a frozen init no longer throws
