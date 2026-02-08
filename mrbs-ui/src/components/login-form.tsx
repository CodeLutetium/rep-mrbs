
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
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser } from "@/services/auth-service"
import { useSetUser } from "@/context/user-context"

export function LoginForm({
    className,
    redirect,
    ...props
}: React.ComponentProps<"div"> & { redirect: string | null }) {
    const [user, setUser] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate();
    const setUserContext = useSetUser();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault(); // prevent form from refreshing
        setIsLoading(true);


        const res = await loginUser(user, password)
        // Login failed
        if (!res.success) {
            setErrorMessage("Incorrect username or password")
            setIsLoading(false)
        } else {
            localStorage.setItem("display_name", res.display_name)
            localStorage.setItem("username", res.username)
            localStorage.setItem("email", res.email)
            localStorage.setItem("level", res.level)

            setUserContext({
                name: res.username,
                display_name: res.display_name,
                email: res.email,
            })
            navigate({ pathname: "/", search: redirect ? `?date=${redirect}` : "" })
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    {/* <CardDescription> */}
                    {/*     Login with your Microsoft account */}
                    {/* </CardDescription> */}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            {/* <Field> */}
                            {/*     <Button variant="outline" type="button"> */}
                            {/*         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> */}
                            {/*             <path */}
                            {/*                 d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" */}
                            {/*                 fill="currentColor" */}
                            {/*             /> */}
                            {/*         </svg> */}
                            {/*         Login with Apple */}
                            {/*     </Button> */}
                            {/*     <Button variant="outline" type="button"> */}
                            {/*         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> */}
                            {/*             <path */}
                            {/*                 d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" */}
                            {/*                 fill="currentColor" */}
                            {/*             /> */}
                            {/*         </svg> */}
                            {/*         Login with Google */}
                            {/*     </Button> */}
                            {/* </Field> */}
                            {/* <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card"> */}
                            {/*     Or continue with */}
                            {/* </FieldSeparator> */}
                            <Field>
                                <FieldLabel htmlFor="user">Username</FieldLabel>
                                <Input
                                    id="user"
                                    type="user"
                                    value={user}
                                    onChange={(e) => setUser(e.target.value)}
                                    placeholder="Username or email address"
                                    required
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <a
                                        href="/reset-password"
                                        className="ml-auto text-sm underline-offset-4 hover:underline"
                                        tabIndex={-1}
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                            </Field>
                            <FieldError>{errorMessage}</FieldError>
                            <Field>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Logging in...
                                        </>
                                    ) : (
                                        "Login"
                                    )}
                                </Button>
                                <Button type="reset" variant={"outline"} disabled={isLoading} onClick={() => navigate("/")} className={"cursor-pointer"}>
                                    Back to home
                                </Button>
                                <FieldDescription className="text-center">
                                    {/* Don&apos;t have an account? <a href="#">Sign up</a> */}
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
            </FieldDescription>
        </div>
    )
}
