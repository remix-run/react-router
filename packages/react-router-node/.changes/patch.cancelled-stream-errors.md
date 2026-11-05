Keep handling errors from a cancelled Node stream until it closes, so a `HEAD` request for a file that fails to open no longer crashes the process
