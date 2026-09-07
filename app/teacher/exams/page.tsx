"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { examService } from "@/services/exam.service"

export default function TeacherExamsPage() {
  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: examService.list,
  })

  return (
    <DashboardShell title="Exams">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Generate, review, and run exams from your materials.</p>
          <Button render={<Link href="/teacher/exams/new" />}>
            <Plus className="size-4" />
            New exam
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading exams...</p>
        ) : exams?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Link key={exam.id} href={`/teacher/exams/${exam.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        {exam.title}
                      </CardTitle>
                      <Badge variant={exam.status === "published" ? "success" : "secondary"}>
                        {exam.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {exam.question_count} questions · {exam.total_marks} marks · {exam.time_limit_minutes} min
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No exams yet. Create one from an uploaded material.
          </p>
        )}
      </div>
    </DashboardShell>
  )
}
