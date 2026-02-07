import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { changePassword } from "@/services/auth-service"
import { HttpStatusCode } from "axios"

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
})
    .refine((data) => data.new_password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"], // Attaches error to the 3rd field
    }).refine((data) => data.current_password !== data.new_password, {
        message: "New password must be different from current password.",
        path: ["new_password"],
    })

// Derive TypeScript type from schema
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export function ChangePasswordForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
    })

    // 3. Handle Submit
    async function onSubmit(data: ChangePasswordValues) {
        try {
            const res = await changePassword(data);
            if (res.status != HttpStatusCode.Ok) {
                toast.error(res.data.error)
            } else {
                toast.success("Password changed successfully");
                navigate("/"); // Redirect after success
            }
        } catch (error) {
            // Example: Handle server-side errors (like wrong current password)
            setError("root", { message: "Failed to change password. Please try again." })
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Change password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup>
                            {/* Current Password */}
                            <Field>
                                <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    {...register("current_password")} // Binds input to Zod
                                />
                                {errors.current_password && (
                                    <FieldError>{errors.current_password.message}</FieldError>
                                )}
                            </Field>

                            {/* New Password */}
                            <Field>
                                <FieldLabel htmlFor="newPassword">New password (min. 8 characters)</FieldLabel>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    {...register("new_password")}
                                />
                                {errors.new_password && (
                                    <FieldError>{errors.new_password.message}</FieldError>
                                )}
                            </Field>

                            {/* Confirm Password */}
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter new password"
                                    {...register("confirm_password")}
                                />
                                {errors.confirm_password && (
                                    <FieldError>{errors.confirm_password.message}</FieldError>
                                )}
                            </Field>

                            {/* Global/Server Errors */}
                            {errors.root && (
                                <FieldError>{errors.root.message}</FieldError>
                            )}

                            <Field className="pt-2">
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Change Password"
                                    )}
                                </Button>
                                <Button type="reset" variant={"outline"} className={"cursor-pointer"}>
                                    <Link to={"/"}>
                                        Back
                                    </Link>
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
