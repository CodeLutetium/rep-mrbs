import { useUser } from "@/context/user-context"
import { useNavigate } from "react-router-dom"
import UserDashboard from "@/components/admin/user-dashboard"
import { AdminProvider } from "@/context/admin-context";


export default function AdminPage() {
    const user = useUser();
    const navigate = useNavigate()

    if (!user || user.level < 2) {
        navigate("/")
    }

    return (
        <div className="flex min-h-screen w-full flex-col ">
            <div className="mx-auto grid w-full max-w-6xl gap-2 py-8">
                <h1 className="text-3xl font-semibold text-center text-primary">Admin Dashboard</h1>
            </div>

            <div className="mx-auto grid w-full items-start gap-6 py-4">
                <AdminProvider>
                    <UserDashboard />
                </AdminProvider>
            </div>
        </div >
    )
}
