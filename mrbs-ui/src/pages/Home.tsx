import DailyBookings from "@/components/daily-bookings";
import { DatePickerInput } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import dayjs, { Dayjs } from 'dayjs';
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useSearchParams } from "react-router-dom";

export default function Home() {
    // Returns the current business day
    const getInitialDate = () => {
        // Priority: If user put ?date=... in URL, respect it.
        const paramDate = searchParams.get("date");
        if (paramDate) return dayjs(paramDate);

        // Logic: If it is before 2:00 AM, treat it as yesterday
        const now = dayjs();
        if (now.hour() < 2) {
            return now.subtract(1, 'day');
        }

        return now;
    };


    const [searchParams] = useSearchParams();
    const selectedDate = getInitialDate();
    const [currDate, setCurrDate] = useState<Dayjs>(dayjs(selectedDate));

    const handleTodayClick = () => {
        const now = dayjs();
        if (now.hour() < 2) {
            setCurrDate(now.subtract(1, 'day'));
        } else {
            setCurrDate(now);
        }
    }

    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <div className="flex flex-col-reverse sm:flex-row gap-2 items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                    <Button variant={"outline"} size={"icon"} className="cursor-pointer" onClick={() => (setCurrDate(currDate.subtract(1, 'day')))}>
                        <ArrowLeft />
                    </Button>
                    <Button onClick={() => handleTodayClick()}>
                        Today
                    </Button>
                    <Button variant={"outline"} size={"icon"} className={"cursor-pointer"} onClick={() => (setCurrDate(currDate.add(1, 'day')))}>
                        <ArrowRight />
                    </Button>
                </div>
                <DatePickerInput date={currDate} setDate={setCurrDate} />
                {/* <h1 className="text-xl font-semibold text-center text-sky-900 dark:text-sky-100 "> */}
                {/* </h1> */}
            </div>

            <DailyBookings currDate={currDate} />
        </div >
    )
}
