---
"react-router": major
---

MM
---
"react-router": patch
---

Fix RSC double slashes in manifest URLs

Normalize double slashes in getManifestUrl function to prevent ERR_NAME_NOT_RESOLVED errors when URLs contain double slashes like //en//test2/test


