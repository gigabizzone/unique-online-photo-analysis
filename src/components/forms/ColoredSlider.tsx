"use client";

import { useEffect, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Bidirectionally-synced slider + numeric input.
// PRD §5.3 + §6.1: used by all chakra/planet/element/etc. forms.
// Both the filled range and the thumb take their color from `color`.

export interface ColoredSliderProps {
  label?: string;
  hint?: string;
  color: string; // e.g. "#8E44AD"
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  className?: string;
  /** When set, NEGATIVE values render in this colour (bar, thumb + reading)
   *  instead of `color` — e.g. red — so a deficit reads as something to act
   *  on. Positive values keep `color`. Omit to colour by `color` regardless. */
  negativeColor?: string;
  /** input width in chars, defaults to 4 */
  inputWidth?: number;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

export function ColoredSlider({
  label,
  hint,
  color,
  min = -50,
  max = 50,
  step = 1,
  value,
  onChange,
  disabled = false,
  className,
  negativeColor,
  inputWidth = 4,
}: ColoredSliderProps) {
  // Negative values take `negativeColor` (e.g. red) when provided.
  const accent = negativeColor && value < 0 ? negativeColor : color;
  // Local state holds the raw text the user types so they can pass through
  // intermediate states ("-", "" ) without snapping. We commit a clamped
  // numeric value to the parent on every valid keystroke.
  const [text, setText] = useState(String(value));

  // Keep the input in sync if the parent reassigns `value` (e.g. via slider).
  useEffect(() => {
    setText(String(value));
  }, [value]);

  function handleInput(raw: string) {
    setText(raw);
    if (raw === "" || raw === "-") return; // wait for more input
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    const clamped = clamp(Math.round(parsed / step) * step, min, max);
    onChange(clamped);
  }

  function commitInput() {
    // On blur, snap text back to the canonical numeric value
    const parsed = Number(text);
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const clamped = clamp(Math.round(parsed / step) * step, min, max);
    onChange(clamped);
    setText(String(clamped));
  }

  return (
    <div className={cn("w-full", className)}>
      {(label || hint) && (
        <div className="mb-1.5 flex items-baseline justify-between">
          {label && (
            <label className="text-sm font-medium text-foreground">
              {label}
            </label>
          )}
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Slider
          accentColor={accent}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(v) => onChange(v[0] ?? value)}
          disabled={disabled}
          className="flex-1"
          aria-label={label ?? "value"}
        />
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={commitInput}
          disabled={disabled}
          aria-label={label ? `${label} numeric` : "numeric value"}
          className={cn(
            "rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm",
            "text-foreground", // explicit dark text — inputs don't inherit color
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:opacity-50"
          )}
          // +4ch (not +2) leaves room for the number-spinner arrows so the
          // last digit of values like "50" / "-50" isn't clipped.
          // Negative readings turn red (when negativeColor is set).
          style={{
            width: `${inputWidth + 4}ch`,
            color: negativeColor && value < 0 ? negativeColor : undefined,
          }}
        />
      </div>
    </div>
  );
}
