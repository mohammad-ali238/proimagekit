import { Hourglass } from "lucide-react";

export function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
      <Hourglass className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">This tool is coming soon</p>
      <p className="text-sm text-muted-foreground">We&apos;re building it now. Try one of the related tools below in the meantime.</p>
    </div>
  );
}
