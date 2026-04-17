import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export default function ChangelogPage() {
  return (
    <div className="flex h-full flex-col items-center  gap-6 p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2 py-8">
        <h1 className="text-3xl font-semibold text-center text-primary">What's New</h1>
        <p className="text-center text-muted-foreground">Latest updates and improvements to the system.</p>
      </div>

      <ReleaseTimeline>
        <ReleaseItem
          date="17 April 2026"
          type="new"
          title="Express yourself with booking colours"
          description="The booking page is now more colourful. You can choose a colour of your preference, or stick with the good ol' blue"
        />
        <ReleaseItem
          date="05 April 2026"
          type="fix"
          title="Daily booking limit: abuse detection"
          description="Due to instances of people attempting to bypass the 3 hour limit (shameful), a cooldown period has been implemented in between bookings."
        />
      </ReleaseTimeline>
    </div>
  )
}

type ReleaseType = "new" | "improvement" | "fix"

interface ReleaseItemProps {
  date: string
  title: string
  description: string | ReactNode
  type: ReleaseType
  isLast?: boolean
}

function ReleaseItem({ date, title, description, type, isLast }: ReleaseItemProps) {
  const badgeStyles: Record<ReleaseType, string> = {
    new: "bg-emerald-100 text-emerald-700 dark:text-emerald-100 dark:bg-emerald-900/30",
    improvement: "bg-sky-100 text-sky-700 dark:text-sky-100 dark:bg-sky-900/30",
    fix: "bg-slate-200 text-slate-700 dark:text-slate-100 dark:bg-slate-700/30",
  }

  return (
    <div className={cn("relative pl-8 border-l-2 border-muted pb-12", isLast && "pb-0 border-l-transparent")}>
      {/* The Timeline Dot */}
      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{date}</span>
          <Badge variant="secondary" className={cn("capitalize", badgeStyles[type])}>
            {type}
          </Badge>
        </div>

        <h2 className="text-xl font-bold tracking-tight">{title}</h2>

        <div className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  )
}

function ReleaseTimeline({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-3xl">
      {children}
    </div>
  )
}
