import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-indigo-500 focus-visible:ring-[3px] focus-visible:ring-indigo-500/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-red-600 aria-invalid:ring-red-600/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white [a]:hover:bg-indigo-600/80",
        secondary:
          "bg-gray-100 text-gray-900 [a]:hover:bg-gray-100/80",
        destructive:
          "bg-red-600/10 text-red-600 focus-visible:ring-red-600/20 [a]:hover:bg-red-600/20",
        outline:
          "border-gray-200 text-gray-900 [a]:hover:bg-gray-100 [a]:hover:text-gray-500",
        ghost:
          "hover:bg-gray-100 hover:text-gray-500",
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
