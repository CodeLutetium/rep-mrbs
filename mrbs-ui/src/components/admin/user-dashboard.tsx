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
import AddUsersForm from "@/components/add-users-form"
import type { UserData } from "@/models/user"
import { getUsers } from "@/services/user-service"
import { toast } from "sonner"
import { useAdmin } from "@/context/admin-context"


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
                {/* SEARCH / FILTER BAR (Optional but recommended) */}
                <div className="mb-4 flex items-center">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search users..."
                            className="w-full bg-background pl-8"
                        />
                    </div>
                </div>

                {/* USER TABLE */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users && users.map((user) => (
                            <TableRow key={user.user_id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.display_name}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.level === 2 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.level === 2 ? "Admin" : "Student"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger render={
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>

                                        } />
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuGroup>
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    navigator.clipboard.writeText(user.email)
                                                    toast.success("Email copied to clipboard")
                                                }}>
                                                    Copy Email
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
                                            </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

    )
}
