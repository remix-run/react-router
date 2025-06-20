"use server";

import { redirect } from "react-router/rsc";

export function redirectAction(formData: FormData) {
  throw redirect("/?redirected=true");
}
