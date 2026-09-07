"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api-client"
import { roomService } from "@/services/room.service"

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
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
      <DashboardShell title="Exam">
        <p className="text-sm text-muted-foreground">Loading exam...</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title={exam.title}>
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border bg-background p-3">
          <p className="text-sm text-muted-foreground">Total marks: {exam.total_marks}</p>
          <p className="text-lg font-semibold tabular-nums">
            {remaining !== null ? formatRemaining(remaining) : "--:--"}
          </p>
        </div>

        {exam.questions?.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {question.prompt} <span className="text-muted-foreground">({question.marks} marks)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {question.type === "mcq" ? (
                <div className="flex flex-col gap-2">
                  {(question.options ?? []).map((option, optIndex) => (
                    <label key={optIndex} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id]?.selected_option_index === optIndex}
                        onChange={() => saveAnswer(question.id, { selected_option_index: optIndex })}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <Textarea
                  value={answers[question.id]?.response_text ?? ""}
                  onChange={(event) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: { ...prev[question.id], response_text: event.target.value },
                    }))
                  }
                  onBlur={(event) => saveAnswer(question.id, { response_text: event.target.value })}
                  placeholder="Type your answer..."
                  rows={question.type === "essay" ? 8 : 4}
                />
              )}
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={() => {
            submittedRef.current = true
            submitMutation.mutate()
          }}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit exam"}
        </Button>
      </div>
    </DashboardShell>
  )
}
