import DailyBookings from "@/components/daily-bookings";
import dayjs from 'dayjs';

export default function Home() {
    const currDate = dayjs();

    return (
        <div className="w-full h-full flex flex-col space-y-8">
            <h1 className="text-xl font-semibold text-center text-sky-900 dark:text-sky-100 ">
                {currDate.format('DD MMMM YYYY')}
            </h1>

            <DailyBookings currDate={currDate} />
        </div>
    )
}
