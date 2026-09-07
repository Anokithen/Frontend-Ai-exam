"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService } from "@/services/exam.service"
import type { RoomParticipant } from "@/types/exam"

export default function RoomDetailPage() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId
  const queryClient = useQueryClient()

  const { data: room, isLoading } = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => examService.getRoom(roomId),
  })

  const closeMutation = useMutation({
    mutationFn: () => examService.closeRoom(roomId),
    onSuccess: (updated) => {
      toast.success("Room closed.")
      queryClient.setQueryData(["rooms", roomId], (prev: typeof room) => (prev ? { ...prev, ...updated } : prev))
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to close room.")),
  })

  if (isLoading || !room) {
    return (
      <DashboardShell title="Room">
        <p className="text-sm text-muted-foreground">Loading room...</p>
      </DashboardShell>
    )
  }

  const participants = (room.participants ?? []) as unknown as RoomParticipant[]

  return (
    <DashboardShell title={room.exam_title ?? "Exam room"}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invite code</CardTitle>
              <Badge variant={room.status === "open" ? "success" : "secondary"}>{room.status}</Badge>
            </div>
            <CardDescription>Share this code with students so they can join.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-3xl font-bold tracking-widest">{room.invite_code}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" render={<Link href={`/teacher/rooms/${roomId}/grade`} />}>
                Grading
              </Button>
              {room.status === "open" && (
                <Button variant="destructive" size="sm" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
                  Close room
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has joined yet.</p>
            ) : (
              participants.map((p, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{p.student_name}</p>
                    <p className="text-xs text-muted-foreground">{p.student_email}</p>
                  </div>
                  <Badge variant="outline">
                    {p.submission ? p.submission.status : "not started"}
                    {p.submission?.total_score != null ? ` · ${p.submission.total_score}/${p.submission.max_score}` : ""}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
