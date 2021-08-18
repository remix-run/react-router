export function atob(a: string): string {
  return Buffer.from(a, "base64").toString("binary");
}

export function btoa(b: string): string {
  return Buffer.from(b, "binary").toString("base64");
}
