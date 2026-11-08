import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <WifiOff className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">You&apos;re offline</h1>
      <p className="mt-3 text-muted-foreground">
        This page hasn&apos;t been saved for offline use yet. Tools you&apos;ve already opened keep working without a
        connection.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Back to all tools
      </Link>
    </div>
  );
}
