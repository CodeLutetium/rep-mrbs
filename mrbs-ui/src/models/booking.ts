/**
 * Interface for the booking class
 * */
export interface Booking {
    booking_id: number;
    username: string;
    start_time: Date;
    end_time: Date;
    room_id: number;
    title: string;
    description?: string;
}


