"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { MaterialUpload } from "@/components/teacher/material-upload"

export default function TeacherMaterialsPage() {
  return (
    <DashboardShell title="Study materials">
      <PageHeader
        title="Study materials"
        description="PDF, scan or photo. Text is extracted so you can correct it before generating."
      />
      <MaterialUpload />
    </DashboardShell>
  )
}
