import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#8e8e8e] selection:bg-primary selection:text-primary-foreground border-input flex h-11 sm:h-9 w-full min-w-0 rounded-[5px] border bg-[#151316]/70 px-3 py-1 text-base text-foreground transition-[color,border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2",
        "aria-invalid:ring-destructive/30 aria-invalid:border-destructive-text",
        className
      )}
      {...props}
    />
  );
}

export { Input };
