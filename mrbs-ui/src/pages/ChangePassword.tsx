import { ChangePasswordForm } from "@/components/change-password-form";


export default function ChangePassword() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex items-center gap-2 self-center font-bold text-2xl text-[#181C62] dark:text-sky-50">
                    <img src="/rep-logo.jpg" className="size-8 dark:hidden" />
                    NTU REP
                </div>
                <div className="flex items-center self-center text-lg">
                    Meeting Room Booking System
                </div>
                <div className="flex flex-col gap-2">
                    <ChangePasswordForm />
                </div>
            </div>
        </div>
    )
}
