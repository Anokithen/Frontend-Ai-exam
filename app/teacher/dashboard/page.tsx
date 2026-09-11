"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowRight, ChevronRight, ClipboardCheck, FileText, Plus, Radio, Sparkles, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { useAuth } from "@/providers/auth-provider"
import { dashboardService } from "@/services/dashboard.service"

/** "Good morning/afternoon/evening" — the greeting the design opens with. */
function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "teacher"],
    queryFn: dashboardService.teacherSummary,
  })

  const firstName = user?.full_name?.split(/\s+/)[0]
  const pending = data?.pending_grading ?? 0
  const active = data?.active_exams ?? 0

  return (
    <DashboardShell title="Teacher dashboard">
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description={
          isLoading
            ? "Loading your workspace..."
            : `${active} ${active === 1 ? "exam is" : "exams are"} running and ${pending} ${
                pending === 1 ? "submission is" : "submissions are"
              } waiting to be graded.`
        }
        action={
          <Button render={<Link href="/teacher/exams/new" />}>
            <Plus className="size-4" />
            New exam
          </Button>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-5">
        <StatCard label="Exams created" value={data?.total_exams ?? 0} icon={FileText} />
        <StatCard label="Students reached" value={data?.total_students ?? 0} icon={Users} />
        <StatCard
          label="Running now"
          value={active}
          delta={active ? "live rooms open" : undefined}
          up={active > 0}
          icon={Radio}
        />
        <StatCard label="Awaiting grading" value={pending} icon={ClipboardCheck} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="mr-auto">Recent exams</CardTitle>
            <Button variant="outline" size="sm" render={<Link href="/teacher/exams" />}>
              View all
              <ArrowRight />
            </Button>
          </div>
        </CardHeader>
        <div className="flex flex-col gap-3 px-6">
          {isLoading ? (
            <p className="py-4 text-sm text-muted-foreground">Loading exams...</p>
          ) : data?.recent_exams?.length ? (
            data.recent_exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/teacher/exams/${exam.id}`}
                className="flex flex-wrap items-center gap-4 rounded-[18px] bg-background px-5 py-4 text-foreground shadow-nm transition-shadow hover:shadow-nm-inset hover:text-foreground"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-nm-dim shadow-nm-inset-sm">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-[180px] flex-1">
                  <div className="text-[15px] font-medium">{exam.title}</div>
                  <div className="mt-1 text-[12.8px] text-nm-dim">
                    {exam.question_count} questions · {exam.total_marks} marks · {exam.time_limit_minutes} min ·{" "}
                    {exam.language}
                  </div>
                </div>
                <Badge variant={exam.status === "published" ? "success" : "secondary"}>{exam.status}</Badge>
                <ChevronRight className="size-4 shrink-0 text-nm-dim" />
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-background px-6 py-8 text-center text-sm text-muted-foreground shadow-nm-inset">
              <Sparkles className="size-6 text-nm-dim" />
              <p>Upload a material in Materials, then generate your first exam with AI.</p>
            </div>
          )}
        </div>
      </Card>
    </DashboardShell>
  )
}
