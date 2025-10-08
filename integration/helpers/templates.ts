const templates = [
  // Vite Major templates
  { name: "vite-5-template", displayName: "Vite 5" },
  { name: "vite-6-template", displayName: "Vite 6" },
  { name: "vite-7-beta-template", displayName: "Vite 7 Beta" },
  { name: "vite-rolldown-template", displayName: "Vite Rolldown" },

  // RSC templates
  { name: "rsc-vite", displayName: "RSC (Vite)" },
  { name: "rsc-parcel", displayName: "RSC (Parcel)" },
  { name: "rsc-vite-framework", displayName: "RSC Framework" },

  // Cloudflare
  // { name: "cloudflare-dev-proxy-template", displayName: "Cloudflare Dev Proxy" },
  { name: "vite-plugin-cloudflare-template", displayName: "Cloudflare" },
] as const;

export type Template = (typeof templates)[number];

export function getTemplates(names?: Array<Template["name"]>) {
  if (names === undefined) return templates;
  return templates.filter(({ name }) => names.includes(name));
}

export const viteMajorTemplates = getTemplates([
  "vite-5-template",
  "vite-6-template",
  "vite-7-beta-template",
  "vite-rolldown-template",
]);
