import type { LucideIcon, LucideIconData } from "lucide-react";
import { Crop, FileImage, FileSearch, ImageDown, Maximize2, Pipette, Repeat, RotateCw, ShieldOff, Stamp, Wand2 } from "lucide-react";
import { __iconData as crop } from "lucide-react/dist/esm/icons/crop.mjs";
import { __iconData as fileImage } from "lucide-react/dist/esm/icons/file-image.mjs";
import { __iconData as fileSearch } from "lucide-react/dist/esm/icons/file-search.mjs";
import { __iconData as imageDown } from "lucide-react/dist/esm/icons/image-down.mjs";
import { __iconData as maximize2 } from "lucide-react/dist/esm/icons/maximize-2.mjs";
import { __iconData as pipette } from "lucide-react/dist/esm/icons/pipette.mjs";
import { __iconData as repeat } from "lucide-react/dist/esm/icons/repeat.mjs";
import { __iconData as rotateCw } from "lucide-react/dist/esm/icons/rotate-cw.mjs";
import { __iconData as shieldOff } from "lucide-react/dist/esm/icons/shield-off.mjs";
import { __iconData as stamp } from "lucide-react/dist/esm/icons/stamp.mjs";
import { __iconData as wandSparkles } from "lucide-react/dist/esm/icons/wand-sparkles.mjs";

/**
 * Raw SVG data for the icons used in the tools registry, keyed by component.
 * Add an entry when a tool uses a new icon (the OG image falls back to no icon).
 */
const iconData = new Map<LucideIcon, LucideIconData>([
  [Crop, crop],
  [FileImage, fileImage],
  [FileSearch, fileSearch],
  [ImageDown, imageDown],
  [Maximize2, maximize2],
  [Pipette, pipette],
  [Repeat, repeat],
  [RotateCw, rotateCw],
  [ShieldOff, shieldOff],
  [Stamp, stamp],
  [Wand2, wandSparkles],
]);

export function ogIconData(icon: LucideIcon): LucideIconData | undefined {
  return iconData.get(icon);
}
