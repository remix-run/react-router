export const sleep = (n = 500) => new Promise((r) => setTimeout(r, n));
export const rand = () => Math.round(Math.random() * 100);
