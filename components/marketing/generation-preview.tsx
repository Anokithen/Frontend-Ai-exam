"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

/** The pipeline a real generation runs through — the same stages the streaming endpoint reports. */
const STAGES = [
  "Reading material",
  "Extracting text",
  "Drafting questions",
  "Balancing marks",
  "Finalising exam",
]

/**
 * The hero's exam card, cycling through a generation so the page shows the product working
 * rather than describing it. Sample content, deliberately — nothing here is a real exam.
 */
export function GenerationPreview() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => (value + 1) % 9), 1100)
    return () => clearInterval(timer)
  }, [])

  const percent = Math.min(100, Math.round((Math.min(tick, STAGES.length) / STAGES.length) * 100))

  return (
    <div className="min-w-0 rounded-[32px] bg-background p-7 shadow-nm-lg">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="font-heading text-base font-semibold">Photosynthesis · Grade 10</div>
          <div className="mt-1 text-[13px] text-nm-dim">20 questions · 45 min · English</div>
        </div>
        <div className="rounded-full bg-background px-3.5 py-1.5 text-xs text-[#93a6bd] shadow-nm-inset-sm">
          {tick >= STAGES.length ? "Ready to publish" : "Generating"}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {STAGES.map((label, index) => {
          const status = tick > index ? "done" : tick === index ? "running" : "pending"
          return (
            <div
              key={label}
              className="flex items-center gap-3.5 rounded-2xl bg-background px-4 py-3.5 shadow-nm-inset-sm"
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  status === "done" && "bg-nm-success shadow-[0_0_12px_var(--nm-success)]",
                  status === "running" && "animate-pulse bg-primary shadow-[0_0_12px_var(--nm-accent)]",
                  status === "pending" && "bg-[#3b4b5e]"
                )}
              />
              <span className="flex-1 text-[14.5px] text-secondary-foreground">{label}</span>
              <span
                className={cn(
                  "text-[11.5px] tracking-wider uppercase",
                  status === "done" && "text-nm-success",
                  status === "running" && "text-primary",
                  status === "pending" && "text-[#6b7d92]"
                )}
              >
                {status === "done" ? "done" : status === "running" ? "running" : "queued"}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-5 h-3 rounded-full bg-background p-[3px] shadow-nm-inset-sm">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_14px_var(--nm-accent)] transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
