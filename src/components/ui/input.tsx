import * as React from "react"
import { Input as InputPrimitive } from "@heroui/react"

import { cn } from "@/lib/utils"

function Input({
  className,
  ...props
}: React.ComponentProps<typeof InputPrimitive>) {
  return (
    <InputPrimitive
      className={cn("h-8 w-full px-2.5 py-1 text-base md:text-sm", className)}
      {...props}
    />
  )
}

export { Input }
