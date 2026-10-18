const ITEMS = [
  "Small-batch makers",
  "Sourced responsibly",
  "Ships in 48 hours",
  "Designed to last",
  "30-day returns",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="marquee overflow-hidden border-y border-border/70 py-6">
      <div className="marquee-track flex w-max items-center">
        {row.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center whitespace-nowrap"
          >
            <span className="eyebrow px-6 text-foreground/55">{item}</span>
            <span className="size-1 rounded-full bg-clay/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
