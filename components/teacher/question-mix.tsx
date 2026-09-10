"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * One question type's count, set either by clicking along the pip row or by typing.
 *
 * The pips are the quick way — click the fifth pip, get five — and the number field stays so a
 * count beyond the row's length is still reachable.
 */
export function QuestionMix({
  id,
  label,
  count,
  onChange,
  pips = 12,
}: {
  id: string
  label: string
  count: number
  onChange: (count: number) => void
  pips?: number
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <label htmlFor={id}>{label}</label>
        <Input
          id={id}
          type="number"
          min={0}
          value={count}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="h-9 w-20 text-center text-sm"
        />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: pips }, (_, index) => {
          const filled = index < count
          return (
            <button
              key={index}
              type="button"
              // Clicking the pip you are already at clears back to it minus one, so the row
              // can be emptied without reaching for the number field.
              onClick={() => onChange(count === index + 1 ? index : index + 1)}
              aria-label={`Set ${label} to ${index + 1}`}
              className={cn(
                "h-3 flex-1 rounded-md transition-all",
                filled
                  ? "bg-primary shadow-[0_0_10px_rgb(77_141_255_/_0.5),inset_0_1px_0_rgb(255_255_255_/_0.25)]"
                  : "bg-background shadow-nm-inset-sm"
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
