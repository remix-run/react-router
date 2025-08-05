"use server";

import { toggleLiked } from "./liked";

export async function toggleLikedAction() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  toggleLiked();
}
