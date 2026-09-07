"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StatCard } from "@/components/dashboard/stat-card"
import { dashboardService } from "@/services/dashboard.service"
import type { StudentDashboardRoom } from "@/types/dashboard"

function RoomRow({ room, action }: { room: StudentDashboardRoom; action: string }) {
  return (
    <Link
      href={`/student/rooms/${room.id}/${action}`}
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
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
      {isLoading ? (
        <p className="text-muted-foreground">Loading dashboard...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Upcoming exams" value={data?.upcoming_exams.length ?? 0} />
            <StatCard label="Active exams" value={data?.active_exams.length ?? 0} />
            <StatCard label="Completed exams" value={data?.completed_exams.length ?? 0} />
            <StatCard label="Average score" value={data?.average_percentage != null ? `${data.average_percentage}%` : "—"} />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your exams</CardTitle>
                <Button size="sm" render={<Link href="/student/rooms/join" />}>
                  Join with a code
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {!hasAny ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
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
