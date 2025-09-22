"use client";

// @ts-expect-error - needs React 19 types
import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit">Submit{pending && "ing..."}</button>;
}
