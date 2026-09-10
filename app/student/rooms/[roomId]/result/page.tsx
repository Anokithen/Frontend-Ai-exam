"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { roomService } from "@/services/room.service"

export default function ExamResultPage() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId

  const { data: exam, isLoading } = useQuery({
    queryKey: ["rooms", roomId, "exam"],
    queryFn: () => roomService.getExam(roomId),
  })

  if (isLoading || !exam) {
    return (
      <DashboardShell title="Result">
        <p className="text-sm text-muted-foreground">Loading result...</p>
      </DashboardShell>
    )
  }

  const submission = exam.submission

  return (
    <DashboardShell title={exam.title}>
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{exam.title}</CardTitle>
              <Badge variant={submission.status === "graded" ? "success" : "secondary"}>
                {submission.status === "graded" ? "Fully graded" : "Awaiting grading"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-[38px] font-semibold tracking-tight text-nm-accent-bright">
              {submission.total_score ?? 0} / {submission.max_score}
            </p>
            {submission.status !== "graded" && (
              <p className="mt-1 text-sm text-muted-foreground">
                Structured and essay answers are still being graded by your teacher.
              </p>
            )}
          </CardContent>
        </Card>

        {submission.answers?.map((answer) => (
          <Card key={answer.question_id}>
            <CardHeader>
              <CardTitle className="text-base">{answer.question_prompt}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                Score: {answer.score ?? "pending"} / {answer.marks}
              </p>
              {answer.feedback && (
                <p className="rounded-2xl bg-background px-5 py-4 leading-relaxed text-secondary-foreground shadow-nm-inset">
                  {answer.feedback}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  )
}
