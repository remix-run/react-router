Preserve binary request bodies in the Architect adapter

- Avoid decoding base64-encoded bodies to UTF-8 strings for content types other than `multipart/form-data`
