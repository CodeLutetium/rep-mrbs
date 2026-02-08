import { useUser } from "@/context/user-context"
import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoutes() {
    const user = useUser();

    if (!user) {
        return (
            <Navigate to={"/"} />
        )
    }

    return (
        <Outlet />
    )
}
