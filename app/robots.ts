import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything behind sign-in; crawlers only ever see the login redirect.
      disallow: ["/teacher/", "/student/", "/admin/"],
    },
  }
}
