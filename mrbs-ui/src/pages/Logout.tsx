import { useUser } from "@/context/user-context"
import { logoutUser } from "@/services/auth-service"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function Logout() {
    const user = useUser()
    const navigate = useNavigate()

    useEffect(() => {
        let isMounted = true

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

        async function logout(): Promise<void> {
            try {
                await logoutUser();
                await delay(300)
                if (isMounted) {
                    user.setUser(null)
                    localStorage.clear()
                    navigate("/")
                }
            } catch (err) {
                console.error(err);
                user.setUser(null)
                navigate("/")
            }
        }

        logout();
        return () => { isMounted = false }
    }, [])


    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-3">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Logging out
        </div>
    )
}
