"use server";
import { ToggleLikedForm } from "./form";

let liked = false;
export async function toggleLikedAction() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  liked = !liked;
}

export function ServerComponent() {
  return (
    <div>
      <h1>Server Component</h1>
      <ToggleLikedForm liked={liked} toggleLikedAction={toggleLikedAction} />
    </div>
  );
}
