const alreadyWarned: { [message: string]: boolean } = {};

export function warnOnce(message: string, key = message): void {
  if (!alreadyWarned[key]) {
    alreadyWarned[key] = true;
    console.warn(message);
  }
}
