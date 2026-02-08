import { useState } from "react"
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
import { useUser } from "@/context/user-context"
import { useNavigate } from "react-router-dom"
import AddUsersForm from "@/components/add-users-form"

// Mock data for the skeleton
const users = [
    { id: 1, name: "Alice Johnson", email: "alice@ntu.edu.sg", role: "Admin" },
    { id: 2, name: "Bob Smith", email: "bob@ntu.edu.sg", role: "User" },
    { id: 3, name: "Charlie Davis", email: "charlie@ntu.edu.sg", role: "User" },
]

export default function AdminPage() {
    const user = useUser();
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const navigate = useNavigate()

    if (!user || user.level < 2) {
        navigate("/")
    }


    return (
        <div className="flex min-h-screen w-full flex-col  p-4 md:p-10">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            </div>

            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 py-4">
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.role}
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
                                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
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
            </div>
        </div >
    )
}
