import { bookingFormSchema } from "@/components/new-booking-form";
import axiosInstance from "./axios-interceptor";
import type { Booking } from "@/models/booking";
import * as z from "zod"
import type { Axios, AxiosResponse } from "axios";

export async function getBookings(date: string): Promise<Booking[]> {
    return await axiosInstance.get(`/bookings?date=${date}`)
        .then((res) =>
            res.data
        )
        .catch((err) => {
            console.error(err);
            return [];
        })

}

export interface NewBookingResponse {
    booking_id: number,
    message: string,
    error: string,
}


export async function newBooking(data: z.infer<typeof bookingFormSchema>): Promise<AxiosResponse> {
    const validatedData = bookingFormSchema.safeParse(data)

    if (!validatedData.success) {
        console.error(validatedData.error);
        Promise.reject()
    }

    const payload = {
        ...validatedData.data,
        start_time: validatedData.data?.start_time.format("YYYY-MM-DD HH:mm")
    }

    const res = await axiosInstance.post("/bookings/new", payload, { headers: { "Content-Type": "application/json", }, validateStatus: (status) => status < 501 })
    return res;
}
