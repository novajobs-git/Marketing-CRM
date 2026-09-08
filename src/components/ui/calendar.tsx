"use client"

import * as React from "react"
import { Calendar as CalendarPrimitive } from "@heroui/react"
import type { DateValue, CalendarSelectionMode } from "react-aria-components/Calendar"

import { cn } from "@/lib/utils"

function Calendar<
  T extends DateValue = DateValue,
  M extends CalendarSelectionMode = "single",
>({
  className,
  ...props
}: React.ComponentProps<typeof CalendarPrimitive<T, M>>) {
  return (
    <CalendarPrimitive className={cn(className)} {...props}>
      <CalendarPrimitive.Header>
        <CalendarPrimitive.NavButton slot="previous" />
        <CalendarPrimitive.YearPickerTrigger>
          <CalendarPrimitive.YearPickerTriggerHeading />
          <CalendarPrimitive.YearPickerTriggerIndicator />
        </CalendarPrimitive.YearPickerTrigger>
        <CalendarPrimitive.NavButton slot="next" />
      </CalendarPrimitive.Header>
      <div className="relative">
        <CalendarPrimitive.Grid>
          <CalendarPrimitive.GridHeader>
            {(day) => (
              <CalendarPrimitive.HeaderCell>{day}</CalendarPrimitive.HeaderCell>
            )}
          </CalendarPrimitive.GridHeader>
          <CalendarPrimitive.GridBody>
            {(date) => (
              <CalendarPrimitive.Cell date={date}>
                {({ formattedDate, isToday }) => (
                  <>
                    {formattedDate}
                    {isToday && <CalendarPrimitive.CellIndicator />}
                  </>
                )}
              </CalendarPrimitive.Cell>
            )}
          </CalendarPrimitive.GridBody>
        </CalendarPrimitive.Grid>
        <CalendarPrimitive.YearPickerGrid>
          <CalendarPrimitive.YearPickerGridBody />
        </CalendarPrimitive.YearPickerGrid>
      </div>
    </CalendarPrimitive>
  )
}

export { Calendar }
