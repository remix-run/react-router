let liked = false;

export function getLiked() {
  return liked;
}

export function toggleLiked() {
  liked = !liked;
}
