export interface SizePreset {
  id: string;
  platform: string;
  label: string;
  width: number;
  height: number;
}

/** Recommended upload sizes per platform. Update here when platforms change their guidance. */
export const sizePresets: SizePreset[] = [
  { id: "ig-square", platform: "Instagram", label: "Post (square)", width: 1080, height: 1080 },
  { id: "ig-portrait", platform: "Instagram", label: "Post (portrait)", width: 1080, height: 1350 },
  { id: "ig-story", platform: "Instagram", label: "Story / Reel", width: 1080, height: 1920 },
  { id: "x-post", platform: "X", label: "Post image", width: 1600, height: 900 },
  { id: "x-header", platform: "X", label: "Header", width: 1500, height: 500 },
  { id: "fb-post", platform: "Facebook", label: "Link / post image", width: 1200, height: 630 },
  { id: "fb-cover", platform: "Facebook", label: "Page cover", width: 851, height: 315 },
  { id: "yt-thumbnail", platform: "YouTube", label: "Thumbnail", width: 1280, height: 720 },
  { id: "yt-banner", platform: "YouTube", label: "Channel banner", width: 2560, height: 1440 },
  { id: "li-post", platform: "LinkedIn", label: "Post image", width: 1200, height: 627 },
  { id: "li-banner", platform: "LinkedIn", label: "Profile banner", width: 1584, height: 396 },
];
