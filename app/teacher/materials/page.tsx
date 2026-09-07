"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { MaterialUpload } from "@/components/teacher/material-upload"

export default function TeacherMaterialsPage() {
  return (
    <DashboardShell title="Study materials">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Upload PDFs or images here, then use them to generate exams with AI.
        </p>
        <MaterialUpload />
      </div>
    </DashboardShell>
  )
}
