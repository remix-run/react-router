---
"@react-router/dev": patch
---

Fix preset future flags being ignored during config resolution

Fixes a bug where future flags defined by presets were completely ignored. The config resolution was incorrectly reading from `reactRouterUserConfig.future` instead of the merged `userAndPresetConfigs.future`, causing all preset-defined future flags to be lost.

This fix ensures presets can properly enable experimental features as intended by the preset system design.