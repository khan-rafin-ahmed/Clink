import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useInteractionFeedback } from "@/lib/interactionFeedback"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "glass-button bg-gradient-primary text-primary-foreground shadow-amber hover:shadow-amber-lg border border-primary/30 hover:border-primary-hover/50 backdrop-blur-md hover:backdrop-blur-lg",
        destructive:
          "glass-button bg-destructive text-destructive-foreground shadow-md hover:bg-destructive-hover hover:shadow-lg border border-destructive/30 hover:border-destructive-hover/50 backdrop-blur-md",
        outline:
          "glass-effect border-2 border-primary/60 bg-transparent text-primary shadow-glass hover:bg-primary/10 hover:text-primary-foreground hover:shadow-amber hover:border-primary-hover backdrop-blur-md hover:backdrop-blur-lg",
        secondary:
          "glass-button bg-secondary/80 text-secondary-foreground shadow-glass hover:bg-secondary-hover/90 hover:shadow-md border border-secondary/30 hover:border-secondary-hover/50 backdrop-blur-md",
        ghost:
          "hover:bg-accent/20 hover:text-accent-foreground hover:backdrop-blur-sm hover:shadow-glass",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        success:
          "glass-button bg-success text-success-foreground shadow-md hover:shadow-lg border border-success/30 backdrop-blur-md",
        warning:
          "glass-button bg-warning text-warning-foreground shadow-md hover:shadow-lg border border-warning/30 backdrop-blur-md",
        glass:
          "glass-pill bg-transparent text-foreground border border-white/20 hover:border-primary/40 hover:text-primary backdrop-blur-lg hover:backdrop-blur-xl",
        'glass-primary':
          "glass-pill bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 backdrop-blur-lg hover:backdrop-blur-xl",
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
  ({ className, variant, size, asChild = false, onClick, onMouseEnter, ...props }, ref) => {
    const feedback = useInteractionFeedback()
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    // Combine refs
    React.useImperativeHandle(ref, () => buttonRef.current!)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger interaction feedback based on variant
      if (variant === 'glass-primary' || variant === 'default') {
        feedback.drinkSplash(buttonRef.current || undefined)
      } else if (variant === 'glass') {
        feedback.glassClick(buttonRef.current || undefined)
      } else if (variant === 'destructive') {
        feedback.error(buttonRef.current || undefined)
      } else {
        feedback.glassClick(buttonRef.current || undefined)
      }

      onClick?.(e)
    }

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Subtle hover feedback for glass variants
      if (variant?.includes('glass')) {
        feedback.glassHover(buttonRef.current || undefined)
      }

      onMouseEnter?.(e)
    }

    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }