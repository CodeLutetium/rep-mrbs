import { LoginForm } from "@/components/login-form"
import { useUser } from "@/context/user-context"
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
    const user = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();


    const redirect = searchParams.get("redirect")

    // Redirect if user is already logged in.
    if (user)
        navigate({ pathname: "/", search: redirect ? `?date=${redirect}` : "" });


    return (
        <div className="flex h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex items-center gap-2 self-center font-bold text-2xl text-[#181C62] dark:text-sky-50">
                    {/* <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"> */}
                    {/*     <GalleryVerticalEnd className="size-4" /> */}
                    {/* </div> */}
                    <img src="/rep-logo.jpg" className="size-8 dark:hidden" />
                    NTU REP
                </div>
                <div className="flex items-center self-center text-lg">
                    Meeting Room Booking System
                </div>
                <LoginForm redirect={redirect} />
            </div>
        </div>
    )
}
