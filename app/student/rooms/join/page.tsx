"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { KeyRound, LoaderCircle, LogIn } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
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
      <PageHeader title="Join an exam" description="Ask your teacher for the room's invite code." />

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <KeyRound className="size-5 text-nm-accent-bright" />
            Enter invite code
          </CardTitle>
          <CardDescription>Five characters, the same for everyone in the room.</CardDescription>
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
                className="h-20 rounded-[22px] text-center font-heading text-[32px] font-bold tracking-[0.18em] text-nm-accent-bright uppercase"
                maxLength={6}
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={joinMutation.isPending}>
              {joinMutation.isPending ? <LoaderCircle className="animate-spin" /> : <LogIn />}
              {joinMutation.isPending ? "Joining..." : "Join"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
