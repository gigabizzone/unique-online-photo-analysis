"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

// shadcn-style Slider built on @radix-ui/react-slider.
// Accepts an `accentColor` prop (CSS color) so each instance can be tinted
// to the chakra/planet/element/etc. color from the PRD palette.

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  accentColor?: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, accentColor, style, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    style={
      accentColor
        ? ({ ...(style ?? {}), ["--aps-slider-accent" as string]: accentColor })
        : style
    }
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range
        className="absolute h-full"
        style={{
          background:
            "var(--aps-slider-accent, hsl(var(--primary)))",
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border-2 bg-white shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      style={{
        borderColor: "var(--aps-slider-accent, hsl(var(--primary)))",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
      }}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";

export { Slider };
