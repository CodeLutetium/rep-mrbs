import { useEffect, useState } from "react"
import { Plus, Search, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import AddUsersForm from "@/components/admin/add-users-form"
import type { UserData } from "@/models/user"
import { getUsers } from "@/services/user-service"
import { toast } from "sonner"
import { useAdmin } from "@/context/admin-context"
import { DataTable } from "../data-table.tsx"
import { userColumns } from "./user-columns"


export default function UserDashboard() {
    const isAdmin = useAdmin();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserData[]>([])
    // Dialog controls
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    if (!isAdmin) {
        navigate("/", { replace: true });
    }

    useEffect(() => {
        async function fetchUsers() {
            try {
                const users = await getUsers();
                setUsers(users)
            } catch (err) {
                toast.error("Error fetching users from backend.")
                console.error(err);
            }
        }
        fetchUsers();
    }, [])


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        Manage your users and view their permissions here.
                    </CardDescription>
                </div>

                {/* ADD USER DIALOG */}
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger render={
                        <Button size="sm" className="h-8 gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Users
                            </span>
                        </Button>
                    } />
                    <AddUsersForm onSubmit={() => setIsAddUserOpen(false)} />
                </Dialog>
            </CardHeader>

            <CardContent>
                <DataTable columns={userColumns} data={users} />

            </CardContent>
        </Card >

    )
}
