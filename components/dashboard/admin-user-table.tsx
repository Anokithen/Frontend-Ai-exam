"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, Trash2, UserCheck, UserX, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-client"
import { adminService } from "@/services/admin.service"
import type { UserRole } from "@/types/auth"

type RoleFilter = UserRole | "all"
type StatusFilter = "all" | "active" | "inactive"

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" },
]

/** Role reads as a coloured word rather than a chip, so a scan down the column groups by hue. */
const ROLE_COLOR: Record<UserRole, string> = {
  teacher: "text-[#7bc6ff]",
  student: "text-[#4dd8a0]",
  admin: "text-[#c9a6ff]",
}

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

export function AdminUserTable() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<RoleFilter>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)

  const params = {
    page,
    per_page: 10,
    ...(search ? { search } : {}),
    ...(role !== "all" ? { role } : {}),
    ...(status !== "all" ? { is_active: status === "active" } : {}),
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminService.listUsers(params),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminService.updateUser>[1] }) =>
      adminService.updateUser(id, payload),
    onSuccess: () => {
      toast.success("User updated.")
      invalidate()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update user.")),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted.")
      invalidate()
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete user.")),
  })

  return (
    <Card className="px-1">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-4">
          <CardTitle className="mr-auto">Users</CardTitle>
          <div className="relative max-w-[280px] flex-[1_1_200px]">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-nm-dim" />
            <Input
              placeholder="Search name or email"
              aria-label="Search users"
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
              className="h-11 pl-11"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setPage(1)
              setStatus(value as StatusFilter)
            }}
          >
            <SelectTrigger className="w-36" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {/* Sunken rail, one tab lifted — the same filter control as the exam list. */}
          <div className="flex gap-1.5 rounded-2xl bg-background p-1.5 shadow-nm-inset">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={role === filter.value}
                onClick={() => {
                  setPage(1)
                  setRole(filter.value)
                }}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-[13px] transition-all",
                  role === filter.value ? "bg-background text-foreground shadow-nm-xs" : "text-nm-dim hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <div className="px-6">
        <div className="flex gap-4 px-5 pb-3.5 text-xs tracking-wider text-nm-faint uppercase">
          <span className="min-w-[150px] flex-[2]">Name</span>
          <span className="hidden min-w-[110px] flex-1 sm:block">Role</span>
          <span className="hidden min-w-[100px] flex-1 md:block">Joined</span>
          <span className="w-[110px] text-right">Status</span>
          <span className="w-9" />
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Loading users...</p>
          ) : data?.users.length ? (
            data.users.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center gap-4 rounded-[18px] bg-background px-5 py-4 shadow-nm"
              >
                <div className="flex min-w-[150px] flex-[2] items-center gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background text-[12.5px] text-nm-accent-bright shadow-nm-inset-sm">
                    {initials(user.full_name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px]">{user.full_name}</div>
                    <div className="truncate text-[12.3px] text-nm-dim">{user.email}</div>
                  </div>
                </div>

                <div className="hidden min-w-[110px] flex-1 sm:block">
                  <Select
                    value={user.role}
                    onValueChange={(value) =>
                      updateMutation.mutate({ id: user.id, payload: { role: value as UserRole } })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className={cn("w-28 border-0 bg-transparent shadow-none", ROLE_COLOR[user.role])}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <span className="hidden min-w-[100px] flex-1 text-[13.5px] text-nm-dim md:block">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>

                {/* Active is raised, disabled is pressed in — the state IS the depth. */}
                <button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({ id: user.id, payload: { is_active: !user.is_active } })
                  }
                  className={cn(
                    "inline-flex w-[110px] items-center justify-center gap-1.5 rounded-xl bg-background py-2.5 text-[12.5px] transition-all disabled:opacity-50",
                    user.is_active ? "text-nm-success shadow-nm-xs" : "text-nm-dim shadow-nm-inset-sm"
                  )}
                >
                  {user.is_active ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
                  {user.is_active ? "Active" : "Disabled"}
                </button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${user.full_name}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete ${user.full_name}? This cannot be undone.`)) {
                      deleteMutation.mutate(user.id)
                    }
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-background px-5 py-6 text-center text-sm text-muted-foreground shadow-nm-inset">
              <Users className="size-6 text-nm-dim" />
              <p>No users match that search.</p>
            </div>
          )}
        </div>

        {data && data.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data.page} of {data.total_pages} ({data.total} users)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
                <ChevronLeft />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
