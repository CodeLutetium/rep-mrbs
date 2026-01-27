import axiosInstance from "./axios-interceptor";
import type { Booking } from "@/models/booking";

export async function getBookings(date: string): Promise<Booking[]> {
    return await axiosInstance.get(`/bookings?date=${date}`).then(async (res) => res.data).catch((err) => {
        console.error(err);
        return [];
    })

}
