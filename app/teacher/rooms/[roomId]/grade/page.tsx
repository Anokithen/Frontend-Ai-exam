"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService } from "@/services/exam.service"
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

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

/**
 * Marking one written answer: a mark per key rather than a number field, because the range is
 * short and the teacher is doing this dozens of times.
 */
function AnswerGrader({
  submissionId,
  questionId,
  marks,
  initialScore,
  initialFeedback,
  onGraded,
}: {
  submissionId: string
  questionId: string
  marks: number
  initialScore: number | null
  initialFeedback: string | null
  onGraded: () => void
}) {
  const [score, setScore] = useState(initialScore ?? 0)
  const [feedback, setFeedback] = useState(initialFeedback ?? "")

  const gradeMutation = useMutation({
    mutationFn: () => examService.gradeAnswer(submissionId, questionId, { score, feedback }),
    onSuccess: () => {
      toast.success("Grade saved.")
      onGraded()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save grade.")),
  })

  return (
    <div>
      <div className="mt-5 mb-3 text-[13px] text-[#93a6bd]">Score</div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: marks + 1 }, (_, mark) => (
          <button
            key={mark}
            type="button"
            aria-pressed={score === mark}
            onClick={() => setScore(mark)}
            className={cn(
              "size-11 rounded-2xl font-heading text-sm transition-all",
              score === mark
                ? "bg-primary text-primary-foreground shadow-[0_0_14px_rgb(77_141_255_/_0.5),inset_0_1px_0_rgb(255_255_255_/_0.28)]"
                : "bg-background text-nm-dim shadow-nm-inset-sm hover:text-foreground"
            )}
          >
            {mark}
          </button>
        ))}
      </div>

      <div className="mt-5 mb-3 text-[13px] text-[#93a6bd]">Feedback</div>
      <Textarea
        placeholder="What would earn full marks?"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        className="min-h-[90px]"
      />

      <Button className="mt-4" onClick={() => gradeMutation.mutate()} disabled={gradeMutation.isPending}>
        {gradeMutation.isPending ? "Saving..." : "Save grade"}
      </Button>
    </div>
  )
}

export default function GradeRoomPage() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["rooms", roomId, "submissions"],
    queryFn: () => examService.listSubmissions(roomId),
  })

  const { data: submission } = useQuery({
    queryKey: ["submissions", selectedId],
    queryFn: () => examService.getSubmission(selectedId as string),
    enabled: !!selectedId,
  })

  function refreshSelected() {
    if (selectedId) {
      queryClient.invalidateQueries({ queryKey: ["submissions", selectedId] })
      queryClient.invalidateQueries({ queryKey: ["rooms", roomId, "submissions"] })
    }
  }

  function selectNext() {
    if (!submissions?.length) return
    const index = submissions.findIndex((item) => item.id === selectedId)
    setSelectedId(submissions[(index + 1) % submissions.length].id)
  }

  const percent =
    submission && submission.max_score > 0
      ? Math.round(((submission.total_score ?? 0) / submission.max_score) * 100)
      : null

  return (
    <DashboardShell title="Grading">
      <div className="flex flex-wrap items-start gap-6">
        <aside className="w-full min-w-0 flex-[1_1_260px] rounded-[26px] bg-background p-5 shadow-nm-md sm:p-6 md:w-auto md:max-w-[320px]">
          <h2 className="font-heading text-[19px] font-semibold">Submissions</h2>
          <p className="mt-1.5 mb-5 text-[13px] text-nm-dim">
            {submissions?.length ? `${submissions.length} in this room` : "This room"}
          </p>
          {/* Phones scroll the list sideways as chips; from md up it is the vertical rail. */}
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : submissions?.length ? (
              submissions.map((item) => {
                const selected = selectedId === item.id
                return (
                  /* The open submission presses in, so the list reads as a set of tabs. */
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "flex w-auto shrink-0 items-center gap-3.5 rounded-[17px] bg-background px-4 py-3.5 transition-all md:w-full md:shrink",
                      selected ? "text-foreground shadow-nm-inset" : "text-[#a4b5c8] shadow-nm-sm"
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background text-[12.5px] text-nm-accent-bright shadow-nm-xs">
                      {initials(item.student_name)}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm whitespace-nowrap">{item.student_name}</span>
                      <span className="block text-xs text-nm-dim">
                        {item.total_score ?? 0} / {item.max_score}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        item.status === "graded"
                          ? "bg-nm-success shadow-[0_0_10px_rgb(77_216_160_/_0.7)]"
                          : "bg-nm-warning shadow-[0_0_10px_rgb(192_163_106_/_0.6)]"
                      )}
                    />
                  </button>
                )
              })
            ) : (
              <p className="rounded-2xl bg-background px-4 py-6 text-sm text-muted-foreground shadow-nm-inset">
                No submissions yet.
              </p>
            )}
          </div>
        </aside>

        <div className="flex w-full min-w-0 flex-[1_1_420px] flex-col gap-5">
          {submission ? (
            <>
              <div className="flex flex-wrap items-center gap-5 rounded-3xl bg-background p-5 shadow-nm-md sm:p-7">
                <div className="min-w-[180px] flex-1">
                  <h2 className="font-heading text-[21px] font-semibold">{submission.student_name}</h2>
                  <div className="mt-1.5 text-[13.5px] text-nm-dim">
                    {submission.submitted_at
                      ? `Submitted ${new Date(submission.submitted_at).toLocaleString()}`
                      : "Not submitted yet"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-[30px] font-semibold text-nm-accent-bright">
                    {submission.total_score ?? 0} / {submission.max_score}
                  </div>
                  {percent !== null && (
                    <div className="mt-2 text-[12.5px] text-nm-dim">
                      {percent}% {submission.status === "graded" ? "final" : "provisional"}
                    </div>
                  )}
                </div>
              </div>

              {submission.answers?.map((answer) => (
                <div key={answer.question_id} className="rounded-[26px] bg-background px-5 py-5 shadow-nm-md sm:px-7 sm:py-6">
                  <div className="mb-4 flex flex-wrap items-center gap-3.5">
                    <span
                      className={cn(
                        "rounded-full bg-background px-3.5 py-1.5 text-[11.5px] tracking-wide shadow-nm-inset-sm",
                        TYPE_COLOR[answer.question_type]
                      )}
                    >
                      {TYPE_LABEL[answer.question_type]}
                    </span>
                    <span className="ml-auto text-[12.5px] text-nm-dim">
                      {answer.marks} {answer.marks === 1 ? "mark" : "marks"}
                    </span>
                  </div>

                  <div className="mb-4 text-[15.5px] leading-snug text-pretty">{answer.question_prompt}</div>

                  <div className="rounded-[18px] bg-background px-5 py-4 text-[14.5px] leading-relaxed whitespace-pre-wrap text-secondary-foreground shadow-nm-inset">
                    {answer.question_type === "mcq"
                      ? answer.selected_option_index != null
                        ? `Chose option ${answer.selected_option_index + 1}`
                        : "(no option chosen)"
                      : answer.response_text || "(no answer submitted)"}
                  </div>

                  {answer.question_type === "mcq" ? (
                    <div
                      className={cn(
                        "mt-4 text-[13px]",
                        answer.score ? "text-nm-success" : "text-[#ff9f8f]"
                      )}
                    >
                      Auto-scored {answer.score ?? 0}/{answer.marks} ·{" "}
                      {answer.score ? "correct option" : "incorrect option"}
                    </div>
                  ) : (
                    <AnswerGrader
                      submissionId={submission.id}
                      questionId={answer.question_id}
                      marks={answer.marks}
                      initialScore={answer.score}
                      initialFeedback={answer.feedback}
                      onGraded={refreshSelected}
                    />
                  )}
                </div>
              ))}

              {submissions && submissions.length > 1 && (
                <Button variant="outline" size="lg" className="w-fit" onClick={selectNext}>
                  Next student
                </Button>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pick a submission</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Multiple-choice answers are already scored. Choose a student on the left to mark
                their written answers and leave feedback.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
