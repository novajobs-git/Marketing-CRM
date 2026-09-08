"use client"

import * as React from "react"
import { DateField as DateFieldPrimitive } from "@heroui/react"
import type { DateValue } from "react-aria-components/Calendar"

import { cn } from "@/lib/utils"
import { toCalendarDate } from "@/lib/calendar-date"
import { Label } from "@/components/ui/label"

type DateFieldProps<T extends DateValue> = Omit<
  React.ComponentProps<typeof DateFieldPrimitive<T>>,
  "children" | "defaultValue" | "value"
> & {
  label?: React.ReactNode
  defaultValue?: string | T
  value?: string | T
}

function DateField<T extends DateValue = DateValue>({
  className,
  label,
  defaultValue,
  value,
  fullWidth = true,
  ...props
}: DateFieldProps<T>) {
  return (
    <DateFieldPrimitive
      className={cn(className)}
      fullWidth={fullWidth}
      defaultValue={toCalendarDate(defaultValue) as T | undefined}
      value={value === undefined ? undefined : ((toCalendarDate(value) ?? null) as T | null)}
      {...props}
    >
      {label && <Label>{label}</Label>}
      <DateFieldPrimitive.Group fullWidth={fullWidth}>
        <DateFieldPrimitive.Input>
          {(segment) => <DateFieldPrimitive.Segment segment={segment} />}
        </DateFieldPrimitive.Input>
      </DateFieldPrimitive.Group>
    </DateFieldPrimitive>
  )
}

export { DateField }
