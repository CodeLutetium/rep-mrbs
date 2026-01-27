import { Rooms, type Room } from "@/models/rooms";
import dayjs, { Dayjs } from "dayjs";

/**
 *  Show bookings for all rooms on a given day.
 *
 */
export default function DailyBookings({ currDate }: { currDate: Dayjs }) {
    const NUM_ROOMS: number = Rooms.length;
    const startTime: Dayjs = currDate.set('hour', 8).set('minute', 0).set('second', 0);
    const TIME_SLOTS: Array<Dayjs> = Array.from({ length: 36 }, (_, i) => { return startTime.add(i * 30, "minute") })

    // This is the "Source of Truth" for your column widths
    // 96px for Time, then 150px (min-w-37.5) per room
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `96px repeat(${NUM_ROOMS}, minmax(150px, 1fr))`
    };


    return (
        <div className="flex flex-col max-h-fit border rounded-md bd-card overflow-auto isolate">
            <DailyBookingsHeader gridStyle={gridStyle} />

            {/* Grid body */}
            <div className="divide-y">
                {
                    TIME_SLOTS.map((slot, index) => (
                        <div key={index} style={gridStyle} className="">
                            <div className="sticky w-24 bg-background left-0 p-2 z-10 border-r text-sm">
                                {dayjs(slot).format("hh:mm A")}
                            </div>

                            {
                                Rooms.map((room: Room) => (
                                    <div key={room.room_id} className="p-4 border-r last:border-r-0">
                                    </div>
                                ))
                            }

                        </div>
                    ))
                }
            </div >
        </div >
    )
}

function DailyBookingsHeader({ gridStyle }: { gridStyle: any }) {
    return (
        <div style={gridStyle} className="bg-muted/95 sticky top-0 z-40 shadow-sm">
            <div className="sticky w-24 left-0 p-4 z-50 bg-muted border-r font-medium text-sm text-muted-foreground uppercase tracking-wider">Time</div>
            {Rooms.map((room: Room) => (
                <div key={room.room_id} className="z-20 p-4 bg-muted/95 text-center border-r last:border-r-0 ">
                    <div className="font-semibold">
                        {room.display_name}
                    </div>
                    <div>
                        ({room.capacity} pax)
                    </div>
                </div>
            ))
            }
        </div>
    )
}
