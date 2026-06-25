const templates = [
  // Vite Major templates
  { name: "vite-7-template", displayName: "Vite 7" },
  { name: "vite-8-template", displayName: "Vite 8" },

  // RSC templates
  { name: "rsc-vite", displayName: "RSC (Vite)" },
  { name: "rsc-vite-framework", displayName: "RSC Framework" },

  { name: "vite-plugin-cloudflare-template", displayName: "Cloudflare" },
] as const;

export type Template = (typeof templates)[number];

export function getTemplates(names?: Array<Template["name"]>) {
  if (names === undefined) return templates;
  return templates.filter(({ name }) => names.includes(name));
}

export const viteMajorTemplates = getTemplates([
  "vite-7-template",
  "vite-8-template",
]);
