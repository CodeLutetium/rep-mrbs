import type { Booking } from "@/models/booking";
import { Rooms } from "@/models/rooms";
import { getBookings } from "@/services/booking-service";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

/**
 *  Show bookings for all rooms on a given day.
 *
 */
export default function DailyBookings({ currDate }: { currDate: Dayjs }) {
    const NUM_ROOMS = Rooms.length;
    const startTime: Dayjs = currDate.set('hour', 8).set('minute', 0).set('second', 0);
    const TIME_SLOTS: Array<Dayjs> = Array.from({ length: 36 }, (_, i) => { return startTime.add(i * 30, "minute") })

    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        async function loadData() {
            const bookings = await getBookings(currDate.format("YYYY-MM-DD"));
            setBookings(bookings);
        }

        loadData()
    }, [currDate]);

    const bookingMap = useMemo(() => {
        const map = new Map<string, Booking>();

        bookings.forEach(booking => {
            const start = dayjs(booking.start_time);
            const end = dayjs(booking.end_time);

            // Generate all 30-minute slots this booking spans
            let current = start;
            while (current.isBefore(end)) {
                // Create key: "roomId_YYYYMMDD_HHmm"
                const key = `${booking.room_id}_${current.format("YYYYMMDD_HHmm")}`;
                map.set(key, booking);
                current = current.add(30, 'minute');
            }
        });

        return map;
    }, [bookings]);

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
                <div className="sticky top-0 left-0 z-50 p-4 bg-sky-100 dark:bg-sky-900 dark:text-sky-100 border-b border-r font-medium text-sm text-sky-800 uppercase tracking-wider h-20">
                    Time
                </div>

                {/* Room Headers (Sticky Top) */}
                {Rooms.map((room) => (
                    <div key={`header-${room.room_id}`} className="sticky top-0 z-40 p-4 bg-sky-100 text-sky-900 dark:text-sky-100 dark:bg-sky-900 text-center border-b border-r last:border-r-0 h-20">
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
                        {Rooms.map((room) => {
                            const key = `${room.room_id}_${slot.format("YYYYMMDD_HHmm")}`;
                            const activeBooking = bookingMap.get(key);

                            const isStart = activeBooking &&
                                dayjs(activeBooking.start_time).isSame(slot, 'minute'); return (
                                    <div
                                        key={`cell-${room.room_id}-${timeIndex}`}
                                        className={`p-2 border-b border-r last:border-r-0 h-8 transition-colors
                        ${activeBooking ? "bg-sky-100 border-sky-200 dark:bg-sky-800 dark:border-sky-700 dark:text-sky-100" : "group-hover:bg-muted/50 cursor-pointer"}
                    `}
                                    >
                                        {/* Only render the title if this is the FIRST slot of the booking */}
                                        {isStart && (
                                            <div className="text-xs font-semibold text-sky-600 dark:text-sky-100 truncate">
                                                {activeBooking.title}
                                            </div>
                                        )}
                                    </div>
                                )
                        })}
                    </div>
                ))}

            </div>
        </div>
    );
}



