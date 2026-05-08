Add a new `unstable_useRouterState()` hook that consolidates access to active and pending router states (RFC: #12358)

- Data/Framework/RSC only — throws when used without a data router
- This should allow you to consolidate usages of the following hooks which will likely be deprecated and removed in a future major version
  - `useLocation`
  - `useSearchParams`
  - `useParams`
  - `useMatches`
  - `useNavigationType`
  - `useNavigation`

  ```ts
  let { active, pending } = unstable_useRouterState();

  // Active is always populated with the current location
  active.location; // replaces `useLocation()`
  active.searchParams; // replaces `useSearchParams()[0]`
  active.params; // replaces `useParams()`
  active.matches; // replaces `useMatches()`
  active.type; // replaces `useNavigationType()`

  // Pending is only populated during a navigation
  pending.location; // replaces `useNavigation().location`
  pending.searchParams; // equivalent to `new URLSearchParams(useNavigation().search`
  pending.params; // Not directly accessible today
  pending.matches; // Not directly accessible today
  pending.type; // Not directly accessible today
  pending.state; // replaces `useNavigation().state`
  pending.formMethod; // replaces useNavigation().formMethod
  pending.formAction; // replaces useNavigation().formAction
  pending.formEncType; // replaces useNavigation().formEncType
  pending.formData; // replaces useNavigation().formData
  pending.json; // replaces useNavigation().json
  pending.text; // replaces useNavigation().text
  ```
