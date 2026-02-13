import type { UserData } from "@/models/user"
import { type ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs";

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export const userColumns: ColumnDef<UserData>[] = [
    {
        accessorKey: "name",
        header: "Username",
    },
    {
        accessorKey: "display_name",
        header: "Name",
    },
    {
        accessorKey: "level",
        header: "Role",
        cell: ({ row }) => {
            const isAdmin = row.getValue("level") === 2;

            return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {isAdmin ? "Admin" : "Student"}
                </span>
            )
        }
    },
    {
        accessorKey: "last_login",
        header: "Last login",
        cell: ({ row }) => {
            const value: string = row.getValue("last_login");
            return dayjs(value).format("DD/MM/YY hh:mm A")
        }
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const user: UserData = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
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
            )
        }
    }
]
