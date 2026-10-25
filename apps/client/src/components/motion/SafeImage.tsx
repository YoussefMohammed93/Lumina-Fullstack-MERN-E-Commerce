import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  eager?: boolean;
  onSettled?: () => void;
}

/**
 * Image with a deterministic, toned placeholder when a remote photo fails.
 * Keeps the layout intact if an Unsplash URL ever goes away.
 */
export function SafeImage({
  src,
  alt,
  className,
  wrapperClassName,
  eager = false,
  onSettled,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#efe9df_0%,#e3dace_55%,#d8cdbd_100%)]",
          wrapperClassName,
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-6 text-[#8c7a63]/60" strokeWidth={1} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={onSettled}
      onError={() => {
        setFailed(true);
        onSettled?.();
      }}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
