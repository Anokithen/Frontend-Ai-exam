"use client"

import { Circle, CircleCheck, CircleX, LoaderCircle, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import type { GeneratedQuestion, GenerationStage, QuestionProgress } from "@/services/exam.service"

const TYPE_LABEL: Record<GeneratedQuestion["type"], string> = {
  mcq: "Multiple choice",
  structured: "Structured",
  essay: "Essay",
}

/** Each question type keeps one hue across the app, so a paper's shape reads at a glance. */
const TYPE_COLOR: Record<GeneratedQuestion["type"], string> = {
  mcq: "text-[#4dd8a0]",
  structured: "text-[#7bc6ff]",
  essay: "text-[#c9a6ff]",
}

/** How much of a stage is done, 0-1: a running stage with a question count is partly done. */
function stageFraction(stage: GenerationStage): number {
  if (stage.status === "done") return 1
  if (stage.status === "running" && stage.progress?.total) {
    return Math.min(stage.progress.created / stage.progress.total, 0.99)
  }
  return 0
}

/** "Writing question 4 of 8 (Essay) · 3 created" — what the model is on and how many are finished. */
function describeProgress({ created, writing, writing_type, total }: QuestionProgress): string {
  const finished = `${created} of ${total} created`
  if (writing !== null) {
    const kind = writing_type ? ` (${TYPE_LABEL[writing_type]})` : ""
    return `Writing question ${writing} of ${total}${kind} · ${finished}`
  }
  return created === 0 ? "Starting to write..." : finished
}

/** The questions so far, each appearing as the model finishes it. */
function WrittenQuestions({ questions, total }: { questions: GeneratedQuestion[]; total?: number }) {
  return (
    <ol className="mt-3 flex flex-col gap-2" aria-label="Questions written so far">
      {questions.map((question, index) => (
        <li
          key={index}
          className="flex gap-3 rounded-xl bg-background px-3.5 py-2.5 text-[13px] shadow-nm-inset-sm animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <span className="shrink-0 tabular-nums text-[#6b7d92]">
            {index + 1}
            {total ? `/${total}` : ""}
          </span>
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-secondary-foreground">{question.prompt}</div>
            <div className={cn("mt-0.5 text-[11.5px] tracking-wider uppercase", TYPE_COLOR[question.type])}>
              {TYPE_LABEL[question.type]} · {question.marks} {question.marks === 1 ? "mark" : "marks"}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

/**
 * The generation panel. Each stage is a row that sits sunken until it is the one running, when
 * it lifts out of the page — so the eye lands on the current step without reading any text.
 */
export function GenerationStages({ stages, isPending }: { stages: GenerationStage[] | null; isPending: boolean }) {
  const done = stages?.length ? stages.every((stage) => stage.status === "done") : false
  const completed = stages?.reduce((sum, stage) => sum + stageFraction(stage), 0) ?? 0
  const percent = stages?.length ? Math.round((completed / stages.length) * 100) : 0

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
                  "flex items-start gap-4 rounded-[17px] bg-background px-4 py-4 transition-shadow duration-300",
                  stage.status === "running" ? "shadow-nm" : "shadow-nm-inset-sm"
                )}
              >
                {stage.status === "done" ? (
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-nm-success drop-shadow-[0_0_8px_var(--nm-success)]" />
                ) : stage.status === "running" ? (
                  <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-primary drop-shadow-[0_0_8px_var(--nm-accent)]" />
                ) : stage.status === "failed" ? (
                  <CircleX className="mt-0.5 size-4 shrink-0 text-destructive drop-shadow-[0_0_8px_var(--nm-danger)]" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-[#3b4b5e]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] text-secondary-foreground">{stage.label}</div>
                  {stage.status === "running" && stage.progress ? (
                    <>
                      <div
                        className="mt-1 text-[12.5px] text-nm-accent-bright"
                        aria-live="polite"
                      >
                        {describeProgress(stage.progress)}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-background shadow-nm-inset-sm">
                        <div
                          className="h-full rounded-full bg-primary shadow-[0_0_8px_var(--nm-accent)] transition-[width] duration-500 ease-out"
                          style={{
                            width: `${Math.round(stageFraction(stage) * 100)}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    stage.detail &&
                    stage.status !== "pending" && (
                      <div className="mt-1 text-[12.5px] text-[#7c8ea4]">{stage.detail}</div>
                    )
                  )}
                  {stage.questions?.length ? (
                    <WrittenQuestions questions={stage.questions} total={stage.progress?.total} />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "mt-0.5 shrink-0 text-[11.5px] tracking-wider uppercase tabular-nums",
                    stage.status === "done" && "text-nm-success",
                    stage.status === "running" && "text-nm-accent-bright",
                    stage.status === "failed" && "text-destructive",
                    stage.status === "pending" && "text-[#6b7d92]"
                  )}
                >
                  {stage.status === "running" && stage.progress
                    ? `${stage.progress.created}/${stage.progress.total}`
                    : stage.status === "pending"
                      ? "queued"
                      : stage.status}
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
