"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StatCard } from "@/components/dashboard/stat-card"
import { dashboardService } from "@/services/dashboard.service"

export default function TeacherDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "teacher"],
    queryFn: dashboardService.teacherSummary,
  })

  return (
    <DashboardShell title="Teacher Dashboard">
      {isLoading ? (
        <p className="text-muted-foreground">Loading dashboard...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" render={<Link href="/teacher/materials" />}>
              <Upload className="size-4" />
              Study materials
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total exams" value={data?.total_exams ?? 0} />
            <StatCard label="Active exams" value={data?.active_exams ?? 0} />
            <StatCard label="Completed exams" value={data?.completed_exams ?? 0} />
            <StatCard label="Total students" value={data?.total_students ?? 0} />
            <StatCard label="Pending grading" value={data?.pending_grading ?? 0} />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Exams</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" render={<Link href="/teacher/exams" />}>
                    View all
                  </Button>
                  <Button size="sm" render={<Link href="/teacher/exams/new" />}>
                    <Plus className="size-4" />
                    New exam
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {data?.recent_exams?.length ? (
                data.recent_exams.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/teacher/exams/${exam.id}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <span>{exam.title}</span>
                    <Badge variant={exam.status === "published" ? "success" : "secondary"}>{exam.status}</Badge>
                  </Link>
                ))
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Upload a material in Materials, then generate your first exam with AI.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
