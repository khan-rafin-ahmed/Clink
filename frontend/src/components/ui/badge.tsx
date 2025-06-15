import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap hover-scale backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "glass-pill bg-gradient-primary text-btn-primary-text hover:shadow-white shadow-glass border-primary/30",
        secondary:
          "glass-effect bg-secondary/80 text-secondary-foreground hover:bg-secondary/90 shadow-glass border-white/20 hover:border-white/30",
        destructive:
          "glass-effect bg-destructive/80 text-destructive-foreground hover:bg-destructive/90 shadow-glass border-destructive/30 hover:shadow-red-500/30",
        outline:
          "glass-effect text-foreground border-white/30 hover:border-primary/40 hover:bg-white/10 hover:text-primary",
        success:
          "glass-effect bg-success/80 text-success-foreground hover:bg-success/90 shadow-glass border-success/30",
        warning:
          "glass-effect bg-warning/80 text-warning-foreground hover:bg-warning/90 shadow-glass border-warning/30",
        accent:
          "glass-pill bg-accent/80 text-accent-foreground hover:bg-accent/90 shadow-gray border-accent/30",
        glass:
          "glass-effect bg-white/5 text-foreground border-white/20 hover:border-primary/30 hover:bg-white/10 hover:text-primary",
        glow:
          "glass-pill bg-primary/20 text-primary border-primary/40 hover:bg-primary/30 hover:border-primary/60 pulse-glow",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
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
