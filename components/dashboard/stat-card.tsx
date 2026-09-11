import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

/**
 * A single figure on a raised slab. `delta` is the line under the number — the week-on-week
 * movement in the design — and `up` decides whether it reads as gain (green) or neutral.
 * `icon` sits pressed into the top-right corner so a row of cards can be told apart at a glance.
 */
export function StatCard({
  label,
  value,
  delta,
  up = false,
  icon: Icon,
}: {
  label: string
  value: string | number
  delta?: string
  up?: boolean
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="relative gap-0 px-6">
      {Icon && (
        <span className="absolute top-5 right-5 grid size-9 place-items-center rounded-xl bg-background text-nm-accent-bright shadow-nm-inset-sm">
          <Icon className="size-4" />
        </span>
      )}
      <div className="mb-3 pr-10 text-[13px] text-nm-dim">{label}</div>
      <div className="font-heading text-[32px] leading-none font-semibold tracking-tight">{value}</div>
      {delta && (
        <div className={cn("mt-2.5 text-[12.5px]", up ? "text-nm-success" : "text-nm-dim")}>{delta}</div>
      )}
    </Card>
  )
}
