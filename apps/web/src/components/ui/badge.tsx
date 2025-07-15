import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 border font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "bg-white/8 text-white border-white/15 rounded-lg px-3 py-1 text-sm md:text-base",
        secondary:
          "bg-white/5 text-secondary-foreground border-white/20 rounded-lg px-3 py-1 text-sm md:text-base",
        destructive:
          "bg-destructive/80 text-destructive-foreground border-destructive/30 rounded-lg px-3 py-1 text-sm md:text-base",
        outline:
          "text-foreground border-white/30 rounded-lg px-3 py-1 text-sm md:text-base",
        success:
          "bg-success/80 text-success-foreground border-success/30 rounded-lg px-3 py-1 text-sm md:text-base",
        warning:
          "bg-warning/80 text-warning-foreground border-warning/30 rounded-lg px-3 py-1 text-sm md:text-base",
        accent:
          "bg-accent/80 text-accent-foreground border-accent/30 rounded-lg px-3 py-1 text-sm md:text-base",
        glass:
          "bg-white/5 text-foreground border-white/20 rounded-lg px-3 py-1 text-sm md:text-base",
        glow:
          "bg-primary/20 text-primary border-primary/40 rounded-lg px-3 py-1 text-sm md:text-base",
      },
      size: {
        default: "px-3 py-1 text-sm md:text-base",
        sm: "px-2 py-0.5 text-xs md:text-sm",
        lg: "px-4 py-1.5 text-base md:text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
