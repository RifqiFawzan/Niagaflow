import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive:
          "rounded-[5px] bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "rounded-[5px] border border-white/80 bg-transparent text-foreground hover:bg-white/10 active:bg-white/15",
        secondary:
          "rounded-[5px] border border-border bg-secondary text-secondary-foreground hover:bg-accent active:bg-accent/80",
        ghost:
          "rounded-[5px] text-muted-foreground hover:bg-accent hover:text-foreground active:bg-accent/80",
        link: "rounded-[5px] text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 sm:min-h-9 px-4 py-2 has-[>svg]:px-3.5",
        sm: "min-h-11 sm:min-h-8 gap-1.5 px-3 py-1.5 has-[>svg]:px-2.5",
        lg: "min-h-11 px-6 py-2.5 has-[>svg]:px-4",
        icon: "size-11 sm:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
