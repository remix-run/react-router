Write file session data to a temporary file and rename it into place so concurrent commits of the same session can no longer corrupt its file

- Preserve existing session file permissions when replacing the file
