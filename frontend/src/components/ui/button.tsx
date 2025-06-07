import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-primary text-primary-foreground shadow-md hover:shadow-gold-lg hover:shadow-lg border border-primary/20 hover:border-primary-hover/40",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive-hover hover:shadow-lg border border-destructive/20 hover:border-destructive-hover/40",
        outline:
          "border-2 border-primary/60 bg-background text-primary shadow-sm hover:bg-primary hover:text-primary-foreground hover:shadow-gold hover:border-primary-hover backdrop-blur-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover hover:shadow-md border border-secondary/20 hover:border-secondary-hover/40",
        ghost:
          "hover:bg-accent/20 hover:text-accent-foreground transition-colors duration-200 hover:backdrop-blur-sm",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary-hover transition-colors duration-200",
        success:
          "bg-success text-success-foreground shadow-md hover:shadow-lg border border-success/20",
        warning:
          "bg-warning text-warning-foreground shadow-md hover:shadow-lg border border-warning/20",
      },
      size: {
        default: "h-10 px-6 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs font-medium",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-xl px-10 text-lg font-bold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }