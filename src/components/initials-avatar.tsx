const PALETTE = [
  { bg: "bg-avatar-1", fg: "text-avatar-1-foreground" },
  { bg: "bg-avatar-2", fg: "text-avatar-2-foreground" },
  { bg: "bg-avatar-3", fg: "text-avatar-3-foreground" },
  { bg: "bg-avatar-4", fg: "text-avatar-4-foreground" },
  { bg: "bg-avatar-5", fg: "text-avatar-5-foreground" },
  { bg: "bg-avatar-6", fg: "text-avatar-6-foreground" },
] as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function paletteIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PALETTE.length;
}

export function InitialsAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const { bg, fg } = PALETTE[paletteIndex(name)];
  const dimension = size === "sm" ? "size-6 text-[0.65rem]" : "size-8 text-xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${dimension} ${bg} ${fg}`}
    >
      {initialsOf(name)}
    </span>
  );
}
