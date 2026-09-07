"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/lib/api-client"
import { roomService } from "@/services/room.service"

export default function JoinRoomPage() {
  const router = useRouter()
  const [code, setCode] = useState("")

  const joinMutation = useMutation({
    mutationFn: () => roomService.join(code.trim().toUpperCase()),
    onSuccess: (room) => {
      toast.success("Joined room.")
      router.push(`/student/rooms/${room.id}/take`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Invalid invite code.")),
  })

  return (
    <DashboardShell title="Join an exam">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle>Enter invite code</CardTitle>
          <CardDescription>Ask your teacher for the exam room's invite code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!code.trim()) return
              joinMutation.mutate()
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-code">Invite code</Label>
              <Input
                id="invite-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="text-center text-lg tracking-widest uppercase"
                maxLength={6}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={joinMutation.isPending}>
              {joinMutation.isPending ? "Joining..." : "Join"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
