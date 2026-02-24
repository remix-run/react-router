import { Outlet } from "react-router";

export default function Layout() {
  return (
    <>
      <p>Layout A</p>
      <Outlet />
    </>
  );
}
