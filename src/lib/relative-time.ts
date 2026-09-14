const UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 604800, divisor: 86400, unit: "day" },
  { limit: 2629800, divisor: 604800, unit: "week" },
  { limit: 31557600, divisor: 2629800, unit: "month" },
  { limit: Infinity, divisor: 31557600, unit: "year" },
];

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" });

/** "2h ago" style relative time for table rows — narrow style + numeric:auto
 *  gives "just now"/"yesterday" for the near cases, "2h"/"3d" otherwise. */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 10) return "just now";

  for (const { limit, divisor, unit } of UNITS) {
    if (diffSeconds < limit) {
      return formatter.format(-Math.round(diffSeconds / divisor), unit);
    }
  }
  return formatter.format(-Math.round(diffSeconds / 31557600), "year");
}
