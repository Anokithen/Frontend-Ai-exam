/** The heading block every signed-in screen opens with: title, one line of context, an action. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        <h2 className="font-heading text-[28px] font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-2 text-[14.5px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
