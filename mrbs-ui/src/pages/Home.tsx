import DailySchedule from "@/components/daily-schedule";
import dayjs from 'dayjs';

export default function Home() {
    const currDate = dayjs();

    return (
        <div className="w-full h-full flex flex-col space-y-8">
            <h1 className="text-xl font-semibold text-center ">
                {currDate.format('DD MMMM YYYY')}
            </h1>

            <DailySchedule />
        </div>
    )
}
