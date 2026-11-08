// Individual lucide-react icon modules export their raw SVG data. Used for
// Open Graph images, which render on the server where the icon components
// (client components since lucide-react 1.x) can't be called.
declare module "lucide-react/dist/esm/icons/*.mjs" {
  import type { LucideIconData } from "lucide-react";
  export const __iconData: LucideIconData;
}
