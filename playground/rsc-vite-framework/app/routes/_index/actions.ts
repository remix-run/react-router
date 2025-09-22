"use server";

export async function log() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("hello from server");
}
