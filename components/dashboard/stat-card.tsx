import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

/**
 * A single figure on a raised slab. `delta` is the line under the number — the week-on-week
 * movement in the design — and `up` decides whether it reads as gain (green) or neutral.
 */
export function StatCard({
  label,
  value,
  delta,
  up = false,
}: {
  label: string
  value: string | number
  delta?: string
  up?: boolean
}) {
  return (
    <Card className="gap-0 px-6">
      <div className="mb-3 text-[13px] text-nm-dim">{label}</div>
      <div className="font-heading text-[32px] leading-none font-semibold tracking-tight">{value}</div>
      {delta && (
        <div className={cn("mt-2.5 text-[12.5px]", up ? "text-nm-success" : "text-nm-dim")}>{delta}</div>
      )}
    </Card>
  )
}
