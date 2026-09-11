"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { LogoMark } from "@/components/dashboard/logo-mark"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-client"
import { roomService } from "@/services/room.service"
import type { QuestionType } from "@/types/exam"

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  structured: "Structured",
  essay: "Essay",
}

const TYPE_COLOR: Record<QuestionType, string> = {
  mcq: "text-[#4dd8a0]",
  structured: "text-[#7bc6ff]",
  essay: "text-[#c9a6ff]",
}

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export default function TakeExamPage() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId
  const router = useRouter()
  const queryClient = useQueryClient()
  const submittedRef = useRef(false)

  const startMutation = useMutation({
    mutationFn: () => roomService.start(roomId),
  })
  const startedOnce = useRef(false)

  useEffect(() => {
    if (startedOnce.current) return
    startedOnce.current = true
    startMutation.mutate(undefined, {
      onSuccess: (submission) => {
        if (submission.status !== "in_progress") {
          router.replace(`/student/rooms/${roomId}/result`)
        } else {
          queryClient.invalidateQueries({ queryKey: ["rooms", roomId, "exam"] })
        }
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Could not start the exam.")),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: exam } = useQuery({
    queryKey: ["rooms", roomId, "exam"],
    queryFn: () => roomService.getExam(roomId),
    enabled: startMutation.isSuccess,
  })

  const [answers, setAnswers] = useState<Record<string, { selected_option_index?: number; response_text?: string }>>(
    {}
  )
  const [remaining, setRemaining] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  // Flags are a private review aid — they live for this sitting only and are never sent up.
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!exam) return
    const initial: typeof answers = {}
    for (const answer of exam.submission.answers ?? []) {
      initial[answer.question_id] = {
        selected_option_index: answer.selected_option_index ?? undefined,
        response_text: answer.response_text ?? undefined,
      }
    }
    setAnswers(initial)
  }, [exam])

  const submitMutation = useMutation({
    mutationFn: () => roomService.submit(roomId),
    onSuccess: () => {
      toast.success("Exam submitted.")
      router.replace(`/student/rooms/${roomId}/result`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to submit exam.")),
  })

  useEffect(() => {
    if (!exam) return
    const tick = () => {
      const secondsLeft = Math.max(
        0,
        Math.floor((new Date(exam.submission.expires_at).getTime() - Date.now()) / 1000)
      )
      setRemaining(secondsLeft)
      if (secondsLeft <= 0 && !submittedRef.current) {
        submittedRef.current = true
        submitMutation.mutate()
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam])

  function saveAnswer(questionId: string, patch: { selected_option_index?: number; response_text?: string }) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }))
    roomService.saveAnswer(roomId, { question_id: questionId, ...patch }).catch(() => {
      toast.error("Failed to save your answer. Check your connection.")
    })
  }

  if (!exam) {
    return (
      <div className="grid min-h-svh place-items-center bg-background text-sm text-muted-foreground">
        Loading exam...
      </div>
    )
  }

  const questions = exam.questions ?? []
  const question = questions[index]
  const answered = questions.filter((item) => {
    const answer = answers[item.id]
    return answer?.selected_option_index != null || Boolean(answer?.response_text?.trim())
  }).length
  const flaggedCount = Object.values(flags).filter(Boolean).length
  const written = answers[question?.id ?? ""]?.response_text ?? ""

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* The exam has no nav: nothing to click away to while the clock runs. */}
      <header className="sticky top-0 z-10 bg-background shadow-[0_10px_26px_rgb(15_22_30_/_0.55)]">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="mr-auto flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="text-[14.5px] font-medium">{exam.title}</div>
              <div className="mt-0.5 text-[12.5px] text-nm-dim">
                {questions.length} questions · {exam.total_marks} marks
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-background px-5 py-2.5 shadow-nm-inset">
            <span className="text-[12.5px] text-nm-dim">Time left</span>
            <span
              className={cn(
                "font-heading text-lg font-semibold tabular-nums",
                remaining !== null && remaining < 300 ? "text-[#ff9f8f]" : "text-foreground"
              )}
            >
              {remaining !== null ? formatRemaining(remaining) : "--:--"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1080px] flex-wrap items-start gap-5 px-4 pt-6 pb-16 sm:gap-6 sm:px-6 sm:pt-8">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
          {question ? (
            <div className="rounded-[28px] bg-background p-5 shadow-nm-md sm:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-3.5">
                <span className="text-[13px] text-nm-dim">
                  Question {index + 1} of {questions.length}
                </span>
                <span
                  className={cn(
                    "rounded-full bg-background px-3.5 py-1.5 text-[11.5px] tracking-wide shadow-nm-inset-sm",
                    TYPE_COLOR[question.type]
                  )}
                >
                  {TYPE_LABEL[question.type]}
                </span>
                <span className="ml-auto text-[12.5px] text-nm-dim">
                  {question.marks} {question.marks === 1 ? "mark" : "marks"}
                </span>
              </div>

              <h2 className="mb-6 font-heading text-[20px] leading-snug font-semibold tracking-tight text-pretty sm:mb-7 sm:text-[22px]">
                {question.prompt}
              </h2>

              {question.type === "mcq" ? (
                <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-3.5">
                  {(question.options ?? []).map((option, optIndex) => {
                    const chosen = answers[question.id]?.selected_option_index === optIndex
                    return (
                      /* The chosen option is the one pressed into the page. */
                      <button
                        key={optIndex}
                        type="button"
                        role="radio"
                        aria-checked={chosen}
                        onClick={() => saveAnswer(question.id, { selected_option_index: optIndex })}
                        className={cn(
                          "flex min-h-[60px] items-center gap-4 rounded-[18px] bg-background px-4 py-3.5 text-left text-[15px] transition-all sm:px-5 sm:py-4.5 sm:text-[15.5px]",
                          chosen ? "text-foreground shadow-nm-inset-lg" : "text-[#a4b5c8] shadow-nm"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-xl font-heading text-[13.5px]",
                            chosen
                              ? "bg-primary text-primary-foreground shadow-[0_0_14px_rgb(77_141_255_/_0.55),inset_0_1px_0_rgb(255_255_255_/_0.3)]"
                              : "bg-background text-nm-dim shadow-nm-inset-sm"
                          )}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="flex-1">{option}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div>
                  <Textarea
                    aria-label="Your answer"
                    value={written}
                    onChange={(event) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: { ...prev[question.id], response_text: event.target.value },
                      }))
                    }
                    onBlur={(event) => saveAnswer(question.id, { response_text: event.target.value })}
                    placeholder="Type your answer"
                    className={cn(
                      "rounded-[20px] px-6 py-5 text-[15px] leading-relaxed",
                      question.type === "essay" ? "min-h-[280px]" : "min-h-[170px]"
                    )}
                  />
                  <div className="mt-2.5 text-[12.5px] text-nm-dim">
                    {written.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  disabled={index === 0}
                  onClick={() => setIndex((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  aria-pressed={Boolean(flags[question.id])}
                  className={cn(flags[question.id] && "text-[#f2c46a] shadow-nm-inset")}
                  onClick={() => setFlags((prev) => ({ ...prev, [question.id]: !prev[question.id] }))}
                >
                  {flags[question.id] ? "Flagged" : "Flag for review"}
                </Button>
                <Button
                  size="lg"
                  className="ml-auto"
                  disabled={index >= questions.length - 1}
                  onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}
                >
                  {index >= questions.length - 1 ? "Last question" : "Next question"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-3xl bg-background p-8 text-sm text-muted-foreground shadow-nm-inset">
              This exam has no questions.
            </p>
          )}
        </div>

        <aside className="min-w-0 w-full flex-[1_1_240px] rounded-[26px] bg-background p-5 shadow-nm-md sm:p-6 md:sticky md:top-24 md:w-auto md:max-w-[280px]">
          <div className="mb-4 text-[13px] text-nm-dim">Progress</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2.5">
            {questions.map((item, itemIndex) => {
              const answer = answers[item.id]
              const has = answer?.selected_option_index != null || Boolean(answer?.response_text?.trim())
              const current = itemIndex === index
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Go to question ${itemIndex + 1}`}
                  aria-current={current ? "true" : undefined}
                  onClick={() => setIndex(itemIndex)}
                  className={cn(
                    "aspect-square rounded-xl font-heading text-[13.5px] transition-all",
                    current
                      ? "bg-primary text-primary-foreground shadow-[0_0_14px_rgb(77_141_255_/_0.5),inset_0_1px_0_rgb(255_255_255_/_0.28)]"
                      : has
                        ? "bg-background text-nm-success shadow-nm-xs"
                        : cn(
                            "bg-background shadow-nm-inset-sm",
                            flags[item.id] ? "text-[#f2c46a]" : "text-nm-dim"
                          )
                  )}
                >
                  {itemIndex + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-5 text-[12.5px] leading-loose text-nm-dim">
            <div>
              {answered} of {questions.length} answered
            </div>
            <div>{flaggedCount} flagged for review</div>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => {
              if (!window.confirm("Submit the exam? You can't change your answers afterwards.")) return
              submittedRef.current = true
              submitMutation.mutate()
            }}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit exam"}
          </Button>
        </aside>
      </main>
    </div>
  )
}
