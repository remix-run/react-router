---
"@remix-run/router": patch
---

fix: don't default to a `REPLACE` navigation on form submissions if the action redirected. The redirect takes care of avoiding the back-button-resubmit scenario, so by using a `PUSH` we allow the back button to go back to the pre-submission form page (#8979)
