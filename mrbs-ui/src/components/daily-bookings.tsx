import { getOpeningTime, type Booking } from "@/models/booking";
import { Rooms } from "@/models/rooms";
import { getBookings } from "@/services/booking-service";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import React from "react"
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

/**
 *  Show bookings for all rooms on a given day.
 *
 */
export default function DailyBookings({ currDate }: { currDate: Dayjs }) {
    const NUM_ROOMS = Rooms.length;
    const startTime: Dayjs = getOpeningTime(currDate);
    const TIME_SLOTS: Array<Dayjs> = Array.from({ length: 36 }, (_, i) => { return startTime.add(i * 30, "minute") })


    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        async function loadData() {
            const bookings = await getBookings(currDate.format("YYYY-MM-DD"));
            console.log(bookings);

            setBookings(bookings);
            console.log(bookings);

        }

        loadData()
    }, [currDate]);

    // Get Column Index for a Room (1-based index)
    // Time column is #1, so Room 1 is #2, Room 2 is #3...
    const getColIndex = (roomId: string) => {
        const index = Rooms.findIndex(r => r.room_id === roomId);
        return index + 2; // +1 for 0-index, +1 for Time column
    };

    // Get Row Start/Span for a Booking
    const getRowPosition = (booking: Booking) => {
        const start = dayjs(booking.start_time);
        const end = dayjs(booking.end_time);

        // Calculate difference in minutes from grid start (8:00 AM)
        const diffMinutes = start.diff(startTime, 'minute') + 1;

        console.log(`${booking.title} has diffMinutes of ${diffMinutes}`);

        // Each row is 30 mins. +2 because Row 1 is Header, Row 2 is 8:00 AM
        const startRow = Math.floor(diffMinutes / 30) + 2;

        const durationMinutes = end.diff(start, 'minute');
        const span = Math.ceil(durationMinutes / 30);

        return {
            gridColumn: getColIndex(booking.room_id),
            gridRowStart: startRow,
            gridRowEnd: `span ${span}`
        };
    };


    return (
        <div className="w-full h-full overflow-auto border rounded-md bd-card isolate">
            <div
                className="min-w-max grid bg-background"
                style={{
                    // Define Tracks explicitly
                    gridTemplateColumns: `96px repeat(${NUM_ROOMS}, minmax(150px, 1fr))`,
                    // Header is auto height, Time slots are fixed 32px
                    gridTemplateRows: `80px repeat(${TIME_SLOTS.length}, 32px)`
                }}
            >
                {/* --- HEADER ROW (Row 1) --- */}
                <div className="sticky top-0 left-0 z-50 p-4 bg-sky-100 dark:bg-sky-900 border-b border-r font-medium text-sm text-sky-800 dark:text-sky-100 uppercase tracking-wider flex items-center justify-center col-start-1 row-start-1">
                    Time
                </div>
                {Rooms.map((room, i) => (
                    <div
                        key={`header-${room.room_id}`}
                        className="sticky top-0 z-40 p-2 bg-sky-100 dark:bg-sky-900 text-center border-b border-r last:border-r-0 flex flex-col justify-center items-center"
                        style={{ gridColumn: i + 2, gridRow: 1 }}
                    >
                        <div className="font-semibold text-sky-900 dark:text-sky-100">{room.display_name}</div>
                        <div className="text-xs text-sky-700 dark:text-sky-300">({room.capacity} pax)</div>
                    </div>
                ))}

                {/* --- BACKGROUND GRID (Rows 2..N) --- */}
                {TIME_SLOTS.map((slot, i) => {
                    const currentRow = i + 2;
                    return (
                        <React.Fragment key={`row-${i}`}>
                            {/* Time Label (Col 1) */}
                            <div
                                className="sticky left-0 z-30 bg-background border-b border-r text-xs text-muted-foreground flex items-center justify-center"
                                style={{ gridColumn: 1, gridRow: currentRow }}
                            >
                                {slot.format("hh:mm A")}
                            </div>

                            {/* Empty Room Cells (Cols 2..N) - Just for visual grid lines */}
                            {Rooms.map((room, roomIdx) => (
                                <div
                                    key={`grid-${room.room_id}-${i}`}
                                    className="border-b border-r last:border-r-0 hover:bg-muted/30 transition-colors"
                                    style={{ gridColumn: roomIdx + 2, gridRow: currentRow }}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}

                {/* --- BOOKINGS OVERLAY --- */}
                {bookings.map((booking) => {
                    const style = getRowPosition(booking);
                    // Filter out bookings that are completely out of bounds (optional safety)
                    if (style.gridRowStart < 2) return null;

                    // Manual truncation coz for some reason I couldn't get the tailwind classes to cooperate.
                    const MAX_TEXT_LENGTH = 20;
                    if (booking.title.length > MAX_TEXT_LENGTH) {
                        booking.title = booking.title.slice(0, MAX_TEXT_LENGTH);
                        booking.title = `${booking.title}...`
                    }

                    if (booking.booked_by.length > MAX_TEXT_LENGTH) {
                        booking.booked_by = `${booking.booked_by.slice(0, MAX_TEXT_LENGTH)}...`
                    }

                    return (
                        <div
                            key={booking.booking_id}
                            className="group truncate z-10 m-1 rounded bg-sky-100 border-l-4 border-sky-500 dark:bg-sky-900/80 dark:border-sky-400 p-2 text-xs shadow-sm hover:brightness-95 cursor-pointer overflow-hidden flex flex-col justify-center "
                            style={style}
                            title={`${booking.title} (${dayjs(booking.start_time).format("HH:mm")} - ${dayjs(booking.end_time).format("HH:mm")})`
                            }
                        >
                            <div className="font-semibold text-sky-900 dark:text-sky-100 truncate">
                                {booking.title}
                            </div>
                            <div className="text-sky-800 dark:text-sky-200 text-[11px] ">
                                {booking.booked_by}
                            </div>
                            <div className="text-sky-700 dark:text-sky-300 truncate text-[10px] hidden group-hover:block" >
                                {dayjs(booking.start_time).format("HH:mm")} - {dayjs(booking.end_time).format("HH:mm")}
                            </div>
                        </div>
                    );
                })}

            </div>
        </div >
    );
}



