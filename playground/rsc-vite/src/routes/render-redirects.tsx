import { Link, redirect } from "react-router";

export default function RenderRedirect({
  params: { id },
}: {
  params: { id?: string };
}) {
  if (id === "redirect") {
    throw redirect("/render-redirect/redirected");
  }

  if (id === "external") {
    throw redirect("https://example.com/");
  }

  return (
    <>
      <h1>{id || "home"}</h1>
      <Link to="/render-redirect/redirect">Redirect</Link>
      <Link to="/render-redirect/external">External</Link>
    </>
  );
}
