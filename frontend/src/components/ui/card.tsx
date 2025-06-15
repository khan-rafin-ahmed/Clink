import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'glass' | 'interactive' | 'floating' | 'modal'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "glass-card rounded-lg bg-white/5 text-white shadow-sm backdrop-blur-md hover:backdrop-blur-lg hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)] transition-all duration-300",
    glass: "glass-effect rounded-xl bg-white/5 text-white shadow-sm backdrop-blur-lg hover:backdrop-blur-xl hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)] transition-all duration-300",
    interactive: "interactive-card glass-card rounded-xl bg-white/5 text-white shadow-sm hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)] cursor-pointer transition-all duration-300 hover:scale-[0.98]",
    floating: "glass-panel rounded-2xl bg-white/5 text-white shadow-md backdrop-blur-xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] transition-all duration-300",
    modal: "glass-modal rounded-2xl bg-white/5 text-white shadow-lg backdrop-blur-xl"
  }

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      style={{ border: '1px solid hsla(0,0%,100%,.06)', ...props.style }}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg sm:text-xl font-heading font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-6 pt-0 gap-2", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
