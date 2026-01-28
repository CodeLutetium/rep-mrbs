import DailyBookings from "@/components/daily-bookings";
import { Button } from "@/components/ui/button";
import dayjs, { Dayjs } from 'dayjs';
import { useState } from "react";

export default function Home() {
    const [currDate, setCurrDate] = useState<Dayjs>(dayjs());

    return (
        <div className="w-full h-full flex flex-col space-y-8">
            <div className="flex flex-row justify-between">
                <Button onClick={() => (setCurrDate(currDate.subtract(1, 'day')))}>
                    Prev
                </Button>
                <h1 className="text-xl font-semibold text-center text-sky-900 dark:text-sky-100 ">
                    {currDate.format('DD MMMM YYYY')}
                </h1>
                <Button onClick={() => (setCurrDate(currDate.add(1, 'day')))}>
                    Next
                </Button>
            </div>


            <DailyBookings currDate={currDate} />
        </div>
    )
}
