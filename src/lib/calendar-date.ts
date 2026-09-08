import { parseDate, type DateValue } from "@internationalized/date"

/**
 * Every existing form in this app passes/receives dates as plain "YYYY-MM-DD"
 * strings (native `<input type="date">` convention). HeroUI's date components
 * want `DateValue` (`CalendarDate`) objects instead — this bridges the two so
 * call sites can keep passing plain ISO strings.
 */
export function toCalendarDate(
  value: string | DateValue | null | undefined
): DateValue | undefined {
  if (!value) return undefined
  if (typeof value !== "string") return value
  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}
