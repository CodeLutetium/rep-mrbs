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
    colour: number;
}

// Given date object, return date object with start time (earliest time you can book)
export function getOpeningTime(date: Dayjs) {
    return date.set('hour', 8).set('minute', 0).set('second', 0);
}

export const MAX_BOOKING_COLOURS: number = 6;

// For rendering on the daily bookings page.
export const COLOUR_MAP: Record<number, { bg: string, border: string, text: string, booked_by: string, time: string }> = {
    1: {
        bg: "bg-sky-100 dark:bg-sky-900/80", border: "border-sky-500 dark:border-sky-400",
        text: "text-sky-900 dark:text-sky-100", booked_by: "text-sky-800 dark:text-sky-200", time: "text-sky-700 dark:text-sky-300"
    },
    2: {
        bg: "bg-indigo-100 dark:bg-indigo-900/80", border: "border-indigo-500 dark:border-indigo-400",
        text: "text-indigo-900 dark:text-indigo-100", booked_by: "text-indigo-800 dark:text-indigo-200", time: "text-indigo-700 dark:text-indigo-300"
    },
    3: {
        bg: "bg-emerald-100 dark:bg-emerald-900/80", border: "border-emerald-500 dark:border-emerald-400",
        text: "text-emerald-900 dark:text-emerald-100", booked_by: "text-emerald-800 dark:text-emerald-200", time: "text-emerald-700 dark:text-emerald-300"
    },
    4: {
        bg: "bg-amber-100 dark:bg-amber-900/80", border: "border-amber-500 dark:border-amber-400",
        text: "text-amber-900 dark:text-amber-100", booked_by: "text-amber-800 dark:text-amber-200", time: "text-amber-700 dark:text-amber-300"
    },
    5: {
        bg: "bg-slate-100 dark:bg-slate-900/80", border: "border-slate-500 dark:border-slate-400",
        text: "text-slate-900 dark:text-slate-100", booked_by: "text-slate-800 dark:text-slate-200", time: "text-slate-700 dark:text-slate-300"
    },
    6: {
        bg: "bg-rose-100 dark:bg-rose-900/80", border: "border-rose-500 dark:border-rose-400",
        text: "text-rose-900 dark:text-rose-100", booked_by: "text-rose-800 dark:text-rose-200", time: "text-rose-700 dark:text-rose-300"
    },
};

// For colour picker on the form
export const BOOKING_COLOURS = [
    { id: 1, hex: "#0ea5e9", label: "Sky" },
    { id: 2, hex: "#6366f1", label: "Indigo" },
    { id: 3, hex: "#10b981", label: "Emerald" },
    { id: 4, hex: "#f59e0b", label: "Amber" },
    { id: 5, hex: "#64748b", label: "Slate" },
    { id: 6, hex: "#f43f5e", label: "Rose (Admin)" },
];
