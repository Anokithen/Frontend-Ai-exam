"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Check,
  Circle,
  CircleCheck,
  ClipboardCheck,
  Copy,
  DoorClosed,
  LoaderCircle,
  PenLine,
  Radio,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService } from "@/services/exam.service"
import type { RoomParticipant } from "@/types/exam"

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export default function RoomDetailPage() {
  const params = useParams<{ roomId: string }>()
  const roomId = params.roomId
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)

  const { data: room, isLoading } = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => examService.getRoom(roomId),
    // Students join and submit while this page is open, so it refreshes itself.
    refetchInterval: 15_000,
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
  const submitted = participants.filter((p) => p.submission?.submitted_at).length

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room!.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy the code — select it and copy manually.")
    }
  }

  return (
    <DashboardShell title={room.exam_title ?? "Exam room"}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(330px,100%),1fr))] items-start gap-6">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="rounded-[30px] bg-background p-6 text-center shadow-nm-lg sm:p-8">
            <div className="mb-4 text-[13.5px] text-nm-dim">Invite code</div>
            {/* The code is pressed into the surface — the one thing on the page to read aloud. */}
            <div className="rounded-[22px] bg-background px-3 py-5 font-heading text-[38px] font-bold tracking-[0.16em] text-nm-accent-bright shadow-nm-inset-lg [text-shadow:0_0_22px_rgb(77_141_255_/_0.35)] sm:py-6 sm:text-[44px] sm:tracking-[0.18em]">
              {room.invite_code}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={copyCode}>
                {copied ? <Check className="text-nm-success" /> : <Copy />}
                {copied ? "Copied" : "Copy code"}
              </Button>
              <Button variant="outline" render={<Link href={`/teacher/rooms/${roomId}/grade`} />}>
                <ClipboardCheck />
                Grading
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{room.exam_title ?? "Exam"}</CardTitle>
              <CardDescription>{room.time_limit_minutes} min · joined by invite code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(120px,100%),1fr))] gap-3.5">
                {[
                  { value: participants.length, label: "Joined" },
                  { value: submitted, label: "Submitted" },
                  { value: participants.length - submitted, label: "In progress" },
                ].map((counter) => (
                  <div
                    key={counter.label}
                    className="rounded-[18px] bg-background px-4 py-5 shadow-nm-inset-sm"
                  >
                    <div className="font-heading text-2xl font-semibold">{counter.value}</div>
                    <div className="mt-1.5 text-[12.5px] text-nm-dim">{counter.label}</div>
                  </div>
                ))}
              </div>

              {room.status === "open" && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="mt-6 w-full"
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                >
                  {closeMutation.isPending ? <LoaderCircle className="animate-spin" /> : <DoorClosed />}
                  {closeMutation.isPending ? "Closing..." : "Close room"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3.5">
              <CardTitle className="mr-auto">Participants</CardTitle>
              <Badge variant={room.status === "open" ? "success" : "outline"}>
                {room.status === "open" ? <Radio /> : <DoorClosed />}
                {room.status === "open" ? "Room open" : "Room closed"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {participants.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-background px-5 py-8 text-center text-sm text-muted-foreground shadow-nm-inset">
                <Users className="size-6 text-nm-dim" />
                <p>No one has joined yet. Read out the code above.</p>
              </div>
            ) : (
              participants.map((participant, index) => {
                const submission = participant.submission
                const done = Boolean(submission?.submitted_at)
                const scored = submission?.total_score != null
                return (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-4 rounded-[18px] bg-background px-4 py-4 shadow-nm"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-[13px] text-nm-accent-bright shadow-nm-inset-sm">
                      {initials(participant.student_name)}
                    </span>
                    <div className="min-w-[140px] flex-1">
                      <div className="text-[14.5px]">{participant.student_name}</div>
                      <div className="truncate text-[12.3px] text-nm-dim">{participant.student_email}</div>
                    </div>
                    {scored && (
                      <span className="text-[12.5px] text-nm-dim">
                        {submission!.total_score} / {submission!.max_score}
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex min-w-[78px] items-center justify-end gap-1.5 text-right text-[11.5px] tracking-wide uppercase",
                        done ? "text-nm-success" : room.status === "open" ? "text-nm-accent-bright" : "text-nm-dim"
                      )}
                    >
                      {submission ? (
                        done ? (
                          <CircleCheck className="size-3.5" />
                        ) : (
                          <PenLine className="size-3.5" />
                        )
                      ) : (
                        <Circle className="size-3.5" />
                      )}
                      {submission ? (done ? "Submitted" : "Writing") : "Not started"}
                    </span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
