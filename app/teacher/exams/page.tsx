"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { FileText, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService } from "@/services/exam.service"

export default function TeacherExamsPage() {
  const queryClient = useQueryClient()
  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: examService.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (examId: string) => examService.remove(examId),
    onSuccess: () => {
      toast.success("Draft deleted.")
      queryClient.invalidateQueries({ queryKey: ["exams"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete draft.")),
  })

  return (
    <DashboardShell title="Exams">
      <PageHeader
        title="Exams"
        description="Generate, review, and run exams from your materials."
        action={
          <Button render={<Link href="/teacher/exams/new" />}>
            <Plus className="size-4" />
            New exam
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading exams...</p>
        ) : exams?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Link key={exam.id} href={`/teacher/exams/${exam.id}`}>
                <Card className="h-full transition-shadow hover:shadow-nm-inset">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        {exam.title}
                      </CardTitle>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge variant={exam.status === "published" ? "success" : "secondary"}>
                          {exam.status}
                        </Badge>
                        {exam.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete draft "${exam.title}"`}
                            disabled={deleteMutation.isPending}
                            onClick={(event) => {
                              // The whole card is a link, so the click must not navigate.
                              event.preventDefault()
                              event.stopPropagation()
                              if (window.confirm(`Delete draft "${exam.title}"? This cannot be undone.`)) {
                                deleteMutation.mutate(exam.id)
                              }
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-[12.8px] text-nm-dim">
                    {exam.question_count} questions · {exam.total_marks} marks · {exam.time_limit_minutes} min ·{" "}
                    {exam.language}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-background px-6 py-10 text-center text-sm text-muted-foreground shadow-nm-inset">
            No exams yet. Create one from an uploaded material.
          </p>
        )}
      </div>
    </DashboardShell>
  )
}
