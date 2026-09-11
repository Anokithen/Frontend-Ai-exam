"use client"

import { Circle, CircleCheck, CircleX, LoaderCircle, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import type { GenerationStage } from "@/services/exam.service"

/**
 * The generation panel. Each stage is a row that sits sunken until it is the one running, when
 * it lifts out of the page — so the eye lands on the current step without reading any text.
 */
export function GenerationStages({ stages, isPending }: { stages: GenerationStage[] | null; isPending: boolean }) {
  const done = stages?.length ? stages.every((stage) => stage.status === "done") : false
  const finished = stages?.filter((stage) => stage.status === "done").length ?? 0
  const percent = stages?.length ? Math.round((finished / stages.length) * 100) : 0

  return (
    <div className="min-w-0 rounded-3xl bg-background p-7 shadow-nm-md">
      <div className="mb-6 flex items-center gap-3.5">
        <h3 className="mr-auto font-heading text-[19px] font-semibold">Generation</h3>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 text-xs shadow-nm-inset-sm",
            done ? "text-nm-success" : isPending ? "text-nm-accent-bright" : "text-nm-dim"
          )}
        >
          {done ? (
            <CircleCheck className="size-3.5" />
          ) : isPending ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {done ? "Ready to review" : isPending ? "Running" : "Idle"}
        </span>
      </div>

      {stages?.length ? (
        <>
          <div className="flex flex-col gap-3">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={cn(
                  "flex items-center gap-4 rounded-[17px] bg-background px-4 py-4 transition-shadow duration-300",
                  stage.status === "running" ? "shadow-nm" : "shadow-nm-inset-sm"
                )}
              >
                {stage.status === "done" ? (
                  <CircleCheck className="size-4 shrink-0 text-nm-success drop-shadow-[0_0_8px_var(--nm-success)]" />
                ) : stage.status === "running" ? (
                  <LoaderCircle className="size-4 shrink-0 animate-spin text-primary drop-shadow-[0_0_8px_var(--nm-accent)]" />
                ) : stage.status === "failed" ? (
                  <CircleX className="size-4 shrink-0 text-destructive drop-shadow-[0_0_8px_var(--nm-danger)]" />
                ) : (
                  <Circle className="size-4 shrink-0 text-[#3b4b5e]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] text-secondary-foreground">{stage.label}</div>
                  {stage.detail && stage.status !== "pending" && (
                    <div className="mt-1 text-[12.5px] text-[#7c8ea4]">{stage.detail}</div>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11.5px] tracking-wider uppercase",
                    stage.status === "done" && "text-nm-success",
                    stage.status === "running" && "text-nm-accent-bright",
                    stage.status === "failed" && "text-destructive",
                    stage.status === "pending" && "text-[#6b7d92]"
                  )}
                >
                  {stage.status === "pending" ? "queued" : stage.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 h-3 rounded-full bg-background p-[3px] shadow-nm-inset-sm">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700 ease-out",
                done ? "bg-nm-success shadow-[0_0_14px_var(--nm-success)]" : "bg-primary shadow-[0_0_14px_var(--nm-accent)]"
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-background px-5 py-8 text-center text-sm text-muted-foreground shadow-nm-inset">
          <Sparkles className="size-6 text-nm-dim" />
          <p>
            Pick a material and a question mix, then generate — each step shows up here as the
            server finishes it.
          </p>
        </div>
      )}
    </div>
  )
}
