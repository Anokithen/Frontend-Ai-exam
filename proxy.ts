import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/register"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value
  const role = request.cookies.get("user_role")?.value

  const isPublicPath = PUBLIC_PATHS.includes(pathname)
  const isTeacherPath = pathname.startsWith("/teacher")
  const isStudentPath = pathname.startsWith("/student")

  if (!accessToken && (isTeacherPath || isStudentPath)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (accessToken && isPublicPath) {
    return NextResponse.redirect(new URL(role === "student" ? "/student/dashboard" : "/teacher/dashboard", request.url))
  }

  if (accessToken && isTeacherPath && role !== "teacher") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url))
  }

  if (accessToken && isStudentPath && role !== "student") {
    return NextResponse.redirect(new URL("/teacher/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/teacher/:path*", "/student/:path*", "/login", "/register"],
}
