const pathIsActive = (to, location, activeOnlyWhenExact) => {
  const { pathname } = location
  return activeOnlyWhenExact ?
    pathname === to : pathname.startsWith(to)
}

export default pathIsActive
