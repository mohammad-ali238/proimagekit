import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${siteConfig.name} keeps your images private: everything is processed in your browser and nothing is ever uploaded.`,
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Your images never leave your device",
    body: [
      "Every tool on this site runs entirely in your web browser. When you add an image, it is read and processed on your own device — it is never uploaded to our servers or anyone else's.",
      "This isn't just a promise: the site sends a strict Content Security Policy that tells your browser to block any attempt by the page to send data to other servers or submit forms. You can check it in your browser's developer tools.",
    ],
  },
  {
    title: "What we store",
    body: [
      "We don't have accounts, and we don't store your images or anything about them. When you close the page, the images are gone from memory.",
      "Your theme choice (light or dark) is saved in your browser's local storage. To make the site work offline, your browser also keeps a copy of the site's own code and pages; your images are never part of that.",
    ],
  },
  {
    title: "Cookies and tracking",
    body: [
      "We don't use advertising or tracking cookies. If we add analytics in the future, we'll use a privacy-friendly, cookie-free service that doesn't collect personal data, and we'll update this page first.",
    ],
  },
  {
    title: "Metadata in your photos",
    body: [
      "Photos often contain hidden information such as the GPS location where they were taken. Converting, compressing, resizing or editing an image here removes that metadata from the result. You can also check a photo with the metadata viewer and clean it with the EXIF remover without changing the image itself.",
    ],
  },
  {
    title: "Links to other sites",
    body: [
      "The metadata viewer can link to OpenStreetMap to show where a photo was taken. That link only opens if you click it, and then OpenStreetMap's own privacy policy applies.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        {siteConfig.name} was built so that your images stay yours. Here is exactly what that means.
      </p>
      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3 text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
