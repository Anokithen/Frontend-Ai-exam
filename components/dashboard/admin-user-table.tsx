"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getApiErrorMessage } from "@/lib/api-client"
import { adminService } from "@/services/admin.service"
import type { UserRole } from "@/types/auth"

type RoleFilter = UserRole | "all"
type StatusFilter = "all" | "active" | "inactive"

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
          }}
          className="max-w-xs"
        />
        <Select
          value={role}
          onValueChange={(value) => {
            setPage(1)
            setRole(value as RoleFilter)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1)
            setStatus(value as StatusFilter)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            ) : data?.users.length ? (
              data.users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="p-3">{user.full_name}</td>
                  <td className="p-3 text-muted-foreground">{user.email}</td>
                  <td className="p-3">
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        updateMutation.mutate({ id: user.id, payload: { role: value as UserRole } })
                      }
                    >
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Badge variant={user.is_active ? "success" : "destructive"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            id: user.id,
                            payload: { is_active: !user.is_active },
                          })
                        }
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete ${user.full_name}? This cannot be undone.`)) {
                            deleteMutation.mutate(user.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.total_pages} ({data.total} users)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.total_pages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
