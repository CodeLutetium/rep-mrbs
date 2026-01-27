import { Rooms, type Room } from "@/models/rooms";
import dayjs, { Dayjs } from "dayjs";

/**
 *  Show bookings for all rooms on a given day.
 *
 */

export default function DailyBookings({ currDate }: { currDate: Dayjs }) {
    const NUM_ROOMS = Rooms.length;
    const startTime: Dayjs = currDate.set('hour', 8).set('minute', 0).set('second', 0);
    const TIME_SLOTS: Array<Dayjs> = Array.from({ length: 36 }, (_, i) => { return startTime.add(i * 30, "minute") })

    // Define Grid: First col 96px, others 150px minimum but grow (1fr)
    const gridStyle = {
        display: 'grid',
        // 96px Time column + N Room columns
        gridTemplateColumns: `96px repeat(${NUM_ROOMS}, minmax(150px, 1fr))`,
    };

    return (
        <div className="w-full h-full overflow-auto border rounded-md bd-card isolate">
            <div style={gridStyle} className="min-w-max"> {/* min-w-max ensures horizontal scroll on small screens */}

                {/* --- HEADER ROW (Sticky Top) --- */}
                {/* Top-Left Corner Cell (Sticky Top & Left) */}
                <div className="sticky top-0 left-0 z-50 p-4 bg-muted border-b border-r font-medium text-sm text-muted-foreground uppercase tracking-wider h-20">
                    Time
                </div>

                {/* Room Headers (Sticky Top) */}
                {Rooms.map((room) => (
                    <div key={`header-${room.room_id}`} className="sticky top-0 z-40 p-4 bg-muted/95 text-center border-b border-r last:border-r-0 h-20">
                        <div className="font-semibold">{room.display_name}</div>
                        <div>({room.capacity} pax)</div>
                    </div>
                ))}

                {/* --- BODY ROWS --- */}
                {TIME_SLOTS.map((slot, timeIndex) => (
                    <div key={`row-${timeIndex}`} className="contents group">
                        {/* Time Label (Sticky Left) */}
                        <div key={`time-${timeIndex}`} className="sticky left-0 z-30 p-2 bg-background border-b border-r text-sm h-8 flex items-center justify-center group-hover:bg-muted/30">
                            {dayjs(slot).format("hh:mm A")}
                        </div>

                        {/* Room Cells for this Time Slot */}
                        {Rooms.map((room) => (
                            <div key={`cell-${room.room_id}-${timeIndex}`} className="p-2 border-b border-r last:border-r-0 h-8 group-hover:bg-muted/50 cursor-pointer transition-colors">
                                {/* Booking content goes here */}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

