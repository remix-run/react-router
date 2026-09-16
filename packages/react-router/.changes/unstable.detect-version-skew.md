Add `future.unstable_detectVersionSkew` to detect version skew on single fetch data requests

Route discovery compares build versions only on `__manifest` requests, and those are skipped for routes the tab has already discovered. A tab loaded before a deploy can therefore navigate between known routes, fetch `.data` from the new server, and render new data with old code. With the flag enabled the server stamps its build version onto every single fetch response and the client performs a document navigation when it differs, matching what the RSC path already does on every data fetch.
