const alreadyWarned: { [message: string]: boolean } = {};

export function warnOnce(
  condition: boolean,
  message: string,
  key = message
): void {
  if (!condition && !alreadyWarned[key]) {
    alreadyWarned[key] = true;
    console.warn(message);
  }
}
