Fix double slash normalization for `useNavigate` colon urls

- As a reminder, `navigate()` is only intended for navigations within the React Router application and not for external navigations to other domains
- This change may be a breaking bug fix if you are using `navigate` for external navigations
