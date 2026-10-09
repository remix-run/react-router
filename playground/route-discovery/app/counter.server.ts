// Shared by both routes. Persists until the server restarts.
let counter = 0;

export function readCounter() {
  return counter;
}

export function incrementCounter() {
  counter++;
}
