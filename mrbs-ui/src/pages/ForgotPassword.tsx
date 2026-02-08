import { Button } from "@/components/ui/button"
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useUser } from "@/context/user-context"
import { resetPassword } from "@/services/auth-service"
import { HttpStatusCode } from "axios"
import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const user = useUser();

    // Redirect if user is already logged in 
    if (user) {
        navigate("/")
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        try {
            const res = await resetPassword(email)
            if (res.status == HttpStatusCode.Ok) {
                toast.success(res.data.message);
                navigate("/login");
            } else {
                toast.error(res.data.error);
            }
        } catch (err) {
            console.error(err);
        }
    }


    return (
        <div className="flex h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex items-center gap-2 self-center font-bold text-2xl text-[#181C62] dark:text-sky-50">
                    <img src="/rep-logo.jpg" className="size-8 dark:hidden" />
                    NTU REP
                </div>
                <div className="flex items-center self-center text-lg">
                    Meeting Room Booking System
                </div>
                <div className="flex flex-col gap-2">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">Reset password</CardTitle>
                            <div>Enter your NTU email address to reset your password.</div>
                        </CardHeader>
                        <CardContent>
                            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="abc@e.ntu.edu.sg"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </Field>
                                    <Button type="submit">Reset password</Button>
                                    <Button type="reset" variant={"outline"} className={"cursor-pointer"} onClick={() => navigate("/login")}>Back</Button>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
