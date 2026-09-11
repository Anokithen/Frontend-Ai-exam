"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { dashboardService } from "@/services/dashboard.service"
import type { StudentDashboardRoom } from "@/types/dashboard"

function RoomRow({ room, action }: { room: StudentDashboardRoom; action: string }) {
  return (
    <Link
      href={`/student/rooms/${room.id}/${action}`}
      className="flex items-center justify-between gap-4 rounded-[18px] bg-background px-5 py-4 text-sm text-foreground shadow-nm transition-shadow hover:text-foreground hover:shadow-nm-inset"
    >
      <span>{room.exam?.title ?? room.exam_title}</span>
      {room.submission ? (
        <Badge variant={room.submission.status === "graded" ? "success" : "secondary"}>
          {room.submission.status === "graded"
            ? `${room.submission.total_score}/${room.submission.max_score}`
            : room.submission.status}
        </Badge>
      ) : (
        <Badge variant="outline">Not started</Badge>
      )}
    </Link>
  )
}

export default function StudentDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: dashboardService.studentSummary,
  })

  const hasAny =
    (data?.upcoming_exams.length ?? 0) + (data?.active_exams.length ?? 0) + (data?.completed_exams.length ?? 0) > 0

  return (
    <DashboardShell title="Student Dashboard">
      <PageHeader
        title="Your exams"
        description="Join with a code from your teacher, then sit the paper here."
        action={
          <Button render={<Link href="/student/rooms/join" />}>Join with a code</Button>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading dashboard...</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-5">
            <StatCard label="Upcoming exams" value={data?.upcoming_exams.length ?? 0} />
            <StatCard label="Active exams" value={data?.active_exams.length ?? 0} />
            <StatCard label="Completed exams" value={data?.completed_exams.length ?? 0} />
            <StatCard label="Average score" value={data?.average_percentage != null ? `${data.average_percentage}%` : "—"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Exam rooms</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {!hasAny ? (
                <p className="rounded-2xl bg-background px-6 py-8 text-center text-sm text-muted-foreground shadow-nm-inset">
                  No exams yet. Join an exam with an invite code from your teacher.
                </p>
              ) : (
                <>
                  {data?.active_exams.map((room) => <RoomRow key={room.id} room={room} action="take" />)}
                  {data?.upcoming_exams.map((room) => <RoomRow key={room.id} room={room} action="take" />)}
                  {data?.completed_exams.map((room) => <RoomRow key={room.id} room={room} action="result" />)}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
