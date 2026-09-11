"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { AdminUserTable } from "@/components/dashboard/admin-user-table"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { useAuth } from "@/providers/auth-provider"
import { adminService } from "@/services/admin.service"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    if (!isAuthLoading && user && user.role !== "admin") {
      router.replace("/login")
    }
  }, [isAuthLoading, user, router])

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminService.stats,
    enabled: !isAuthLoading && user?.role === "admin",
  })

  return (
    <DashboardShell title="Admin Dashboard">
      <PageHeader title="Users" description="Everyone with an account on this platform." />

      {isLoading ? (
        <p className="text-muted-foreground">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-5">
            <StatCard label="Total users" value={data?.total_users ?? 0} />
            <StatCard label="Teachers" value={data?.total_teachers ?? 0} />
            <StatCard label="Students" value={data?.total_students ?? 0} />
            <StatCard label="Admins" value={data?.total_admins ?? 0} />
            <StatCard label="Active" value={data?.active_users ?? 0} />
          </div>
          <div className="mt-8">
            <AdminUserTable />
          </div>
        </>
      )}
    </DashboardShell>
  )
}
