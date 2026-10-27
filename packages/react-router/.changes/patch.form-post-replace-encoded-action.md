Avoid duplicate history entries when posting a `<Form>` to the current URL with an encoded `action`

- Replace the current history entry when the `action` contains characters that get percent-encoded, such as spaces or non-ASCII characters
