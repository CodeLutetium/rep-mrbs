import DailyBookings from "@/components/daily-bookings";
import { DatePickerInput } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import dayjs, { Dayjs } from 'dayjs';
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useSearchParams } from "react-router-dom";

export default function Home() {
    const [searchParams] = useSearchParams();
    const selectedDate = searchParams.get("date") || dayjs().format("YYYY-MM-DD");
    const [currDate, setCurrDate] = useState<Dayjs>(dayjs(selectedDate));


    return (
        <div className="w-full h-full flex flex-col space-y-4">
            <div className="flex flex-col-reverse sm:flex-row gap-2 items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                    <Button variant={"outline"} size={"icon"} className="cursor-pointer" onClick={() => (setCurrDate(currDate.subtract(1, 'day')))}>
                        <ArrowLeft />
                    </Button>
                    <Button onClick={() => (setCurrDate(dayjs()))}>
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
