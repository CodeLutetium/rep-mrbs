import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM
const ROOMS = ["Meeting Room 1", "Conference A", "Huddle Space", "Creative Lab"]

export default function DailySchedule() {
    return (
        <div className="flex flex-col max-h-fit border rounded-xl bg-card overflow-hidden">
            {/* 1. Room Header */}
            <div className="grid grid-cols-[80px_1fr] border-b bg-muted/50">
                <div className="p-4 border-r font-medium text-xs text-muted-foreground uppercase tracking-wider">Time</div>
                <div className={`grid grid-cols-${ROOMS.length} divide-x`}>
                    {ROOMS.map((room) => (
                        <div key={room} className="p-4 text-center font-semibold text-sm">
                            {room}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Scrollable Grid Body */}
            <div className="relative grid grid-cols-[80px_1fr] overflow-y-auto">
                {/* Time Labels Sidebar */}
                <div className="grid grid-rows-12 divide-y border-r bg-muted/20">
                    {HOURS.map((hour) => (
                        <div key={hour} className="h-20 p-2 text-right text-xs text-muted-foreground font-medium">
                            {hour}:00
                        </div>
                    ))}
                </div>

                {/* The Booking Slots Grid */}
                <div className="relative">
                    {/* Horizontal Grid Lines */}
                    <div className="absolute inset-0 grid grid-rows-12 divide-y pointer-events-none">
                        {HOURS.map((hour) => <div key={hour} className="h-20" />)}
                    </div>

                    {/* Vertical Grid Lines */}
                    <div className={`absolute inset-0 grid grid-cols-${ROOMS.length} divide-x pointer-events-none`}>
                        {ROOMS.map((room) => <div key={room} />)}
                    </div>

                    {/* 3. Example Booking Overlay */}
                    <div className="relative grid grid-cols-4 h-[960px]"> {/* 12 hours * 80px */}
                        {/* Example: A 2-hour booking in Room 2 starting at 10 AM */}
                        <div
                            className="absolute bg-sky-500/20 border-l-4 border-sky-500 p-2 m-1 rounded-sm text-xs font-medium text-sky-700 dark:text-sky-300"
                            style={{
                                gridColumn: 2,
                                top: "160px", // (10 AM - 8 AM) * 80px
                                height: "160px" // 2 hours * 80px
                            }}
                        >
                            Project Sync
                            <span className="block opacity-70">10:00 - 12:00</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
