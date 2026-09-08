"use client"

import * as React from "react"
import {
  DatePicker as DatePickerPrimitive,
  DateField as DateFieldPrimitive,
} from "@heroui/react"
import type { DateValue } from "react-aria-components/Calendar"

import { cn } from "@/lib/utils"
import { toCalendarDate } from "@/lib/calendar-date"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"

type DatePickerProps<T extends DateValue> = Omit<
  React.ComponentProps<typeof DatePickerPrimitive<T>>,
  "children" | "defaultValue" | "value"
> & {
  label?: React.ReactNode
  defaultValue?: string | T
  value?: string | T
}

function DatePicker<T extends DateValue = DateValue>({
  className,
  label,
  defaultValue,
  value,
  ...props
}: DatePickerProps<T>) {
  return (
    <DatePickerPrimitive
      className={cn("w-full", className)}
      defaultValue={toCalendarDate(defaultValue) as T | undefined}
      value={value === undefined ? undefined : ((toCalendarDate(value) ?? null) as T | null)}
      {...props}
    >
      {label && <Label>{label}</Label>}
      <DateFieldPrimitive.Group fullWidth>
        <DateFieldPrimitive.Input>
          {(segment) => <DateFieldPrimitive.Segment segment={segment} />}
        </DateFieldPrimitive.Input>
        <DatePickerPrimitive.Trigger>
          <DatePickerPrimitive.TriggerIndicator />
        </DatePickerPrimitive.Trigger>
      </DateFieldPrimitive.Group>
      <DatePickerPrimitive.Popover>
        <Calendar />
      </DatePickerPrimitive.Popover>
    </DatePickerPrimitive>
  )
}

export { DatePicker }
