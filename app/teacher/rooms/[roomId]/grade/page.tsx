"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService } from "@/services/exam.service"

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
    <div className="flex flex-col gap-2 border-t pt-3">
      <div className="flex items-center gap-2">
        <Label className="shrink-0">Score</Label>
        <Input
          type="number"
          min={0}
          max={marks}
          className="w-24"
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
        />
        <span className="text-sm text-muted-foreground">/ {marks}</span>
      </div>
      <Textarea
        placeholder="Feedback (optional)"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
      />
      <Button size="sm" className="w-fit" onClick={() => gradeMutation.mutate()} disabled={gradeMutation.isPending}>
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

  return (
    <DashboardShell title="Grading">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submissions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : submissions?.length ? (
              submissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                    selectedId === s.id ? "bg-muted" : ""
                  }`}
                >
                  <span>{s.student_name}</span>
                  <Badge variant={s.status === "graded" ? "success" : "secondary"}>{s.status}</Badge>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            )}
          </CardContent>
        </Card>

        {submission ? (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{submission.student_name}</CardTitle>
                  <Badge variant={submission.status === "graded" ? "success" : "secondary"}>
                    {submission.status} · {submission.total_score ?? 0}/{submission.max_score}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
            {submission.answers?.map((answer) => (
              <Card key={answer.question_id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {answer.question_prompt} <span className="text-muted-foreground">({answer.marks} marks)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {answer.question_type === "mcq" ? (
                    <p className="text-sm">
                      Selected option: {answer.selected_option_index ?? "—"} · Auto-graded: {answer.score ?? 0}/
                      {answer.marks}
                    </p>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
                        {answer.response_text || "(no answer submitted)"}
                      </p>
                      <AnswerGrader
                        submissionId={submission.id}
                        questionId={answer.question_id}
                        marks={answer.marks}
                        initialScore={answer.score}
                        initialFeedback={answer.feedback}
                        onGraded={refreshSelected}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a submission to grade.</p>
        )}
      </div>
    </DashboardShell>
  )
}
