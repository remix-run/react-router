Adjust express adapter host computation

- read port from `x-forwarded-host` based on `trust proxy` setting
- handle invalid hostname characters
