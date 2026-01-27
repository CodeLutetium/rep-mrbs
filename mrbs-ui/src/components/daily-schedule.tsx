import { cn } from "@/lib/utils"
import { Rooms } from "@/models/rooms"

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

export default function DailySchedule() {
    const NUM_ROOMS = Rooms.length;

    // Logic: On small screens, force width to show 3 rooms (33.33% each). 
    // On large screens, let them flex or stay fixed.
    const gridStyle = {
        gridTemplateColumns: `repeat(${NUM_ROOMS}, minmax(33.33%, 1fr))`
    };

    return (
        <div className="flex flex-col h-full border rounded-xl bg-card overflow-hidden">
            {/* The wrapper MUST have overflow-x-auto. 
               We use 'isolate' to ensure sticky elements stay in their layers.
            */}
            <div className="flex-1 overflow-auto isolate">

                {/* 1. Room Header */}
                <div className="grid grid-cols-[80px_1fr] border-b bg-muted/50 sticky top-0 z-30">
                    {/* Top Left Corner - Sticky in both directions */}
                    <div className="p-4 border-r font-medium text-xs text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted z-40">
                        Time
                    </div>

                    {/* Header Row */}
                    <div className="grid divide-x" style={gridStyle}>
                        {Rooms.map((room) => (
                            <div key={room.room_id} className="p-4 text-center text-sm min-w-0">
                                <div className="font-semibold truncate">{room.display_name}</div>
                                <div className="font-light text-xs">({room.capacity} pax)</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Grid Body */}
                <div className="relative grid grid-cols-[80px_1fr]">

                    {/* Time Labels Sidebar - Sticky to the left */}
                    <div className="grid grid-rows-12 divide-y border-r bg-muted/20 sticky left-0 z-20">
                        {HOURS.map((hour) => (
                            <div key={hour} className="h-20 p-2 text-right text-xs text-muted-foreground font-medium bg-muted/50 backdrop-blur-sm">
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
                        <div className="absolute inset-0 grid divide-x pointer-events-none" style={gridStyle}>
                            {Rooms.map((room) => <div key={room.room_id} />)}
                        </div>

                        {/* 3. Booking Overlay */}
                        {/* Ensure grid-cols matches the room count */}
                        <div className="relative grid h-[960px]" style={gridStyle}>
                            {/* Example Booking */}
                            <div
                                className="absolute bg-sky-500/20 border-l-4 border-sky-500 p-2 m-1 rounded-sm text-xs font-medium text-sky-700 dark:text-sky-300"
                                style={{
                                    gridColumn: 2, // Maps to the 2nd room
                                    top: "160px",
                                    height: "160px",
                                    width: "calc(100% - 8px)" // Accounting for margin
                                }}
                            >
                                Project Sync
                                <span className="block opacity-70">10:00 - 12:00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
