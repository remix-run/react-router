"use server";

import { redirect } from "react-router";

export function redirectAction(formData: FormData) {
  throw redirect("/?redirected=true");
}
