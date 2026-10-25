import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  responsive = true,
}: {
  className?: string;
  responsive?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label="Lumina"
      className={cn("relative block shrink-0", className)}
    >
      {responsive && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-center bg-no-repeat md:hidden"
          style={{
            backgroundImage: "url('/logo-icon.png')",
            backgroundSize: "56px 56px",
          }}
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-center bg-no-repeat",
          responsive && "hidden md:block",
        )}
        style={{
          backgroundImage: "url('/logo-text.png')",
          backgroundSize: "155px 60px",
        }}
      />
    </span>
  );
}

export function BrandLoadingScreen({
  label = "Loading",
  overlay = false,
}: {
  label?: string;
  overlay?: boolean;
}) {
  return (
    <main
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-background px-6 text-center",
        overlay && "fixed inset-0 z-[100]",
      )}
    >
      <div aria-hidden="true" className="lumina-loader">
        <span />
      </div>
      <BrandLogo className="h-12 w-36" responsive={false} />
      <span className="eyebrow text-muted-foreground">{label}</span>
    </main>
  );
}
