import Image from "next/image";
import { CLIENT_BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** CSS recreation of the TOP okno 2×2 mark (T O / P O-green) */
export function TopOknoMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  const cell = Math.round(size / 2);
  return (
    <div
      className={cn("grid shrink-0 grid-cols-2 gap-px overflow-hidden bg-white", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {(
        [
          ["T", CLIENT_BRAND.primary],
          ["O", CLIENT_BRAND.primary],
          ["P", CLIENT_BRAND.primary],
          ["O", CLIENT_BRAND.accent],
        ] as const
      ).map(([letter, bg]) => (
        <span
          key={`${letter}-${bg}`}
          className="flex items-center justify-center font-display text-white"
          style={{
            backgroundColor: bg,
            width: cell,
            height: cell,
            fontSize: Math.round(cell * 0.62),
            lineHeight: 1,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export function BrandLogo({
  className,
  height = 36,
  showWordmark = true,
  variant = "image",
}: {
  className?: string;
  height?: number;
  showWordmark?: boolean;
  variant?: "image" | "mark";
}) {
  if (variant === "mark" || !showWordmark) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TopOknoMark size={height} />
        {showWordmark && (
          <span className="font-display text-xl tracking-tight text-[var(--brand-ink)]">
            kno
            <sup className="ml-0.5 text-[0.55em] text-[var(--brand-ink)]">TN</sup>
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={CLIENT_BRAND.logoPath}
      alt={CLIENT_BRAND.legalName}
      width={Math.round(height * 4.2)}
      height={height}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height }}
      priority
    />
  );
}
