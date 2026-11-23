import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-[#8e8e8e] focus-visible:border-ring focus-visible:ring-ring/40 aria-invalid:ring-destructive/30 aria-invalid:border-destructive-text flex field-sizing-content min-h-20 w-full rounded-[5px] border bg-[#151316]/70 px-3 py-2 text-base text-foreground transition-[color,border-color,box-shadow] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
