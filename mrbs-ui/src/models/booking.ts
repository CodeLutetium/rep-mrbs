import { Dayjs } from "dayjs";

/**
 * Interface for the booking class
 * */
export interface Booking {
    booked_by: string;
    booked_by_username: string;
    booking_id: string;
    description: string;
    end_time: string;
    room_id: string;
    room_name: string;
    start_time: string;
    title: string;
}

// Given date object, return date object with start time (earliest time you can book)
export function getOpeningTime(date: Dayjs) {
    return date.set('hour', 8).set('minute', 0).set('second', 0);
}
