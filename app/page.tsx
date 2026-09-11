import Link from "next/link"

import { LogoMark } from "@/components/dashboard/logo-mark"
import { GenerationPreview } from "@/components/marketing/generation-preview"
import { Button } from "@/components/ui/button"

const FEATURES = [
  {
    title: "Questions from your own material",
    body: "Upload a PDF or a photo of your notes. The model reads it and drafts questions grounded in what you actually taught.",
  },
  {
    title: "MCQ, structured, essay",
    body: "Choose how many of each and the marks they carry. Edit any prompt before the paper goes out.",
  },
  {
    title: "Tamil and English",
    body: "Exam content renders in Tamil script as reliably as it does in English, including the extracted source text.",
  },
  {
    title: "Timed rooms with invite codes",
    body: "Open a room, share the code, and every student gets the same clock from the moment they join.",
  },
  {
    title: "Grading with feedback",
    body: "Objective answers score themselves. For written work you adjust the score and leave a comment per question.",
  },
  {
    title: "Export the paper as PDF",
    body: "Download the exam with or without the answer key for printing, invigilation, or your records.",
  },
]

const STEPS = [
  { n: "1", title: "Upload notes", body: "PDF, scan, or photo. Correct the extracted text if the scan was rough." },
  { n: "2", title: "Set the shape", body: "Question mix, time limit, language. Generate and watch it build." },
  { n: "3", title: "Open a room", body: "Publish the exam and hand out the invite code." },
  { n: "4", title: "Mark and review", body: "Scores land as students submit. Grade the written answers and export." },
]

const HERO_STATS = [
  { value: "3", label: "question types" },
  { value: "PDF + photo", label: "material upload" },
  { value: "தமிழ் / EN", label: "exam languages" },
]

export default function Page() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-foreground">
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-7">
        <div className="mr-auto flex items-center gap-3.5">
          <LogoMark className="size-10 rounded-2xl" chipClassName="size-3.5" />
          <span className="font-heading text-[17px] font-semibold tracking-tight">
            AI Teacher Exam Platform
          </span>
        </div>
        <nav className="hidden items-center gap-7 text-[14.5px] sm:flex">
          <a href="#features" className="text-[#93a6bd] hover:text-foreground">
            Features
          </a>
          <a href="#how" className="text-[#93a6bd] hover:text-foreground">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="outline" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button render={<Link href="/register" />}>Create account</Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-center gap-10 px-4 pt-8 pb-14 sm:gap-14 sm:px-6 sm:pt-12 sm:pb-20">
        <div className="min-w-0">
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full bg-background px-4 py-2.5 text-[13px] text-[#93a6bd] shadow-nm-inset-sm">
            <span className="size-[7px] rounded-full bg-nm-success shadow-[0_0_10px_var(--nm-success)]" />
            Built for teachers, not IT departments
          </div>
          <h1 className="font-heading text-[clamp(38px,5.2vw,60px)] leading-[1.05] font-bold tracking-[-0.03em] text-pretty">
            Your notes, an exam,
            <br />
            and the marking done.
          </h1>
          <p className="mt-6 max-w-[30em] text-[17.5px] leading-relaxed text-[#93a6bd] text-pretty">
            Generate exam questions from your notes with AI, run timed online exams, and get instant
            analytics.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button size="lg" className="h-14 px-8 text-[15.5px]" render={<Link href="/register" />}>
              Create an exam
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-[15.5px]"
              render={<a href="#how" />}
            >
              See how it works
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-9">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-[26px] font-semibold">{stat.value}</div>
                <div className="mt-1 text-[13.5px] text-nm-dim">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <GenerationPreview />
      </section>

      <section id="features" className="mx-auto max-w-[1180px] px-4 pt-6 pb-16 sm:px-6 sm:pt-8 sm:pb-24">
        <h2 className="font-heading text-[clamp(26px,3.4vw,36px)] font-semibold tracking-tight">
          Everything the exam takes
        </h2>
        <p className="mt-2.5 max-w-[48ch] text-base text-nm-dim">
          From the file on your desk to a marked paper, without leaving the browser.
        </p>
        <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(min(290px,100%),1fr))] gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[26px] bg-background px-7 py-8 shadow-nm-md transition-shadow hover:shadow-nm-inset-lg"
            >
              <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-background shadow-nm-inset-sm">
                <span className="nm-glow size-3 rounded-[4px]" />
              </div>
              <h3 className="font-heading text-[17.5px] font-semibold">{feature.title}</h3>
              <p className="mt-2.5 text-[14.8px] leading-relaxed text-muted-foreground text-pretty">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="font-heading text-[clamp(26px,3.4vw,36px)] font-semibold tracking-tight">
          Four steps, start to marked
        </h2>
        <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-6">
          {STEPS.map((step) => (
            <div key={step.n} className="rounded-[26px] bg-background px-7 py-7 shadow-nm-inset-lg">
              <div className="mb-5 grid size-11 place-items-center rounded-full bg-background font-heading text-[15px] font-semibold text-[#8fb8ff] shadow-nm-xs">
                {step.n}
              </div>
              <h3 className="font-heading text-[16.5px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground text-pretty">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="rounded-[34px] bg-background p-[clamp(28px,6vw,68px)] text-center shadow-nm-lg">
          <h2 className="font-heading text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.025em] text-pretty">
            Set your next paper tonight.
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[16.5px] text-muted-foreground text-pretty">
            Upload one set of notes and see the questions it produces. No card, no setup.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <Button size="lg" className="h-14 px-8 text-[15.5px]" render={<Link href="/register" />}>
              Create account
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-[15.5px]"
              render={<Link href="/login" />}
            >
              Sign in
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-5 px-4 pb-14 text-[13.5px] text-nm-faint sm:px-6">
        <span className="mr-auto">© 2026 AI Teacher Exam Platform</span>
        <a href="#features" className="text-nm-faint hover:text-nm-accent-soft">
          Features
        </a>
        <a href="#how" className="text-nm-faint hover:text-nm-accent-soft">
          How it works
        </a>
        <Link href="/login" className="text-nm-faint hover:text-nm-accent-soft">
          Sign in
        </Link>
      </footer>
    </div>
  )
}
