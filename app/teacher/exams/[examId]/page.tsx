"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Download, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService, type QuestionInput } from "@/services/exam.service"

let nextTempId = 1

function withKey(questions: QuestionInput[]): (QuestionInput & { _key: string })[] {
  return questions.map((q) => ({ ...q, _key: q.id ?? `new-${nextTempId++}` }))
}

export default function ExamEditorPage() {
  const params = useParams<{ examId: string }>()
  const examId = params.examId
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exams", examId],
    queryFn: () => examService.get(examId),
  })
  const { data: rooms } = useQuery({
    queryKey: ["exams", examId, "rooms"],
    queryFn: () => examService.listRooms(examId),
    enabled: exam?.status === "published",
  })

  const [title, setTitle] = useState("")
  const [timeLimit, setTimeLimit] = useState(60)
  const [questions, setQuestions] = useState<(QuestionInput & { _key: string })[]>([])

  useEffect(() => {
    if (exam) {
      setTitle(exam.title)
      setTimeLimit(exam.time_limit_minutes)
      setQuestions(withKey(exam.questions ?? []))
    }
  }, [exam])

  const saveMutation = useMutation({
    mutationFn: () =>
      examService.update(examId, {
        title,
        time_limit_minutes: timeLimit,
        questions: questions.map(({ _key, ...q }) => q),
      }),
    onSuccess: (updated) => {
      toast.success("Exam saved.")
      queryClient.setQueryData(["exams", examId], updated)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save exam.")),
  })

  const publishMutation = useMutation({
    mutationFn: () => examService.publish(examId),
    onSuccess: (updated) => {
      toast.success("Exam published. You can now create a room.")
      queryClient.setQueryData(["exams", examId], updated)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to publish exam.")),
  })

  const createRoomMutation = useMutation({
    mutationFn: () => examService.createRoom(examId),
    onSuccess: (room) => {
      toast.success(`Room created — invite code ${room.invite_code}`)
      router.push(`/teacher/rooms/${room.id}`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create room.")),
  })

  function updateQuestion(key: string, patch: Partial<QuestionInput>) {
    setQuestions((prev) => prev.map((q) => (q._key === key ? { ...q, ...patch } : q)))
  }

  function removeQuestion(key: string) {
    setQuestions((prev) => prev.filter((q) => q._key !== key))
  }

  function addQuestion(type: QuestionInput["type"]) {
    const base: QuestionInput = { type, prompt: "", marks: type === "mcq" ? 1 : type === "structured" ? 5 : 10 }
    if (type === "mcq") {
      base.options = ["", "", "", ""]
      base.correct_option_index = 0
    }
    setQuestions((prev) => [...prev, { ...base, _key: `new-${nextTempId++}` }])
  }

  if (isLoading || !exam) {
    return (
      <DashboardShell title="Exam">
        <p className="text-sm text-muted-foreground">Loading exam...</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell title="Edit exam">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Badge variant={exam.status === "published" ? "success" : "secondary"}>{exam.status}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => examService.downloadPdf(examId, title, false)}>
              <Download className="size-4" />
              Exam PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => examService.downloadPdf(examId, title, true)}>
              <Download className="size-4" />
              With answer key
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="exam-title">Title</Label>
              <Input id="exam-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">Language: {exam.language}</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="exam-time-limit">Time limit (minutes)</Label>
              <Input
                id="exam-time-limit"
                type="number"
                min={1}
                value={timeLimit}
                onChange={(event) => setTimeLimit(Number(event.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {questions.map((question, index) => (
            <Card key={question._key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Q{index + 1} · {question.type} · {question.marks} marks
                  </CardTitle>
                  <Button variant="ghost" size="icon-sm" aria-label="Remove question" onClick={() => removeQuestion(question._key)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Textarea
                  value={question.prompt}
                  onChange={(event) => updateQuestion(question._key, { prompt: event.target.value })}
                  placeholder="Question prompt"
                />
                <div className="flex items-center gap-2">
                  <Label className="shrink-0">Marks</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-24"
                    value={question.marks}
                    onChange={(event) => updateQuestion(question._key, { marks: Number(event.target.value) })}
                  />
                </div>
                {question.type === "mcq" && (
                  <div className="flex flex-col gap-2">
                    {(question.options ?? []).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${question._key}`}
                          checked={question.correct_option_index === optIndex}
                          onChange={() => updateQuestion(question._key, { correct_option_index: optIndex })}
                          aria-label={`Mark option ${optIndex + 1} correct`}
                        />
                        <Input
                          value={option}
                          onChange={(event) => {
                            const options = [...(question.options ?? [])]
                            options[optIndex] = event.target.value
                            updateQuestion(question._key, { options })
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove option"
                          onClick={() => {
                            const options = (question.options ?? []).filter((_, i) => i !== optIndex)
                            const correct =
                              question.correct_option_index === optIndex ? 0 : question.correct_option_index
                            updateQuestion(question._key, { options, correct_option_index: correct })
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() =>
                        updateQuestion(question._key, { options: [...(question.options ?? []), ""] })
                      }
                    >
                      <Plus className="size-3.5" />
                      Add option
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => addQuestion("mcq")}>
            <Plus className="size-4" /> MCQ
          </Button>
          <Button variant="outline" size="sm" onClick={() => addQuestion("structured")}>
            <Plus className="size-4" /> Structured
          </Button>
          <Button variant="outline" size="sm" onClick={() => addQuestion("essay")}>
            <Plus className="size-4" /> Essay
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          {exam.status === "draft" && (
            <Button variant="secondary" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? "Publishing..." : "Publish exam"}
            </Button>
          )}
          {exam.status === "published" && (
            <Button variant="secondary" onClick={() => createRoomMutation.mutate()} disabled={createRoomMutation.isPending}>
              {createRoomMutation.isPending ? "Creating room..." : "Create exam room"}
            </Button>
          )}
        </div>

        {exam.status === "published" && rooms && rooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
              <CardDescription>Previously created rooms for this exam.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/teacher/rooms/${room.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <span>
                    Code <strong>{room.invite_code}</strong> · {room.participant_count} joined
                  </span>
                  <Badge variant={room.status === "open" ? "success" : "secondary"}>{room.status}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
