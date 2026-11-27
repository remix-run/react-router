Fix double-encoding of `%2F` in `match.pathname`/`match.pathnameBase`, which produced `%252F` in resolved paths such as `<Form>` action attributes and `<Link>` hrefs
