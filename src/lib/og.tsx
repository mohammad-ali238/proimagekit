import { ImageResponse } from "next/og";
import { createElement } from "react";
import type { LucideIconData } from "lucide-react";
import { siteConfig } from "@/config/site";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const BLUE = "#2b4fd7";

/** Shared Open Graph card: brand, tool icon, title, description and the privacy promise. */
export function renderOgImage({ title, description, icon }: { title: string; description: string; icon?: LucideIconData }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)",
          color: "#0a0a0a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, fontWeight: 700 }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{color: BLUE}} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"></path><path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"></path><path d="M 7 17h.01"></path><path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8"></path></svg>
          {siteConfig.name}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          {icon && (
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: 40,
                background: BLUE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width={110}
                height={110}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon.node.map(([tag, { key, ...attributes }]) => createElement(tag, { key, ...attributes }))}
              </svg>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, minWidth: 0, maxWidth: icon ? 828 : 1056 }}>
            <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>{title}</div>
            <div style={{ fontSize: 30, color: "#525252", lineHeight: 1.35 }}>{description}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: "#047857", fontWeight: 600 }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Free · Runs in your browser · Files never uploaded
        </div>
      </div>
    ),
    ogSize,
  );
}
