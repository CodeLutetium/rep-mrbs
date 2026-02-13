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
import { DataTableColumnHeader } from "../data-table-column-header";

export const userColumns: ColumnDef<UserData>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Username" />
        ),
    },
    {
        accessorKey: "display_name",
        header: "Name",
    },
    {
        id: "role",
        accessorFn: (row) => {
            return row.level === 2 ? "Admin" : "Student";
        },
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Role" />
        ),
        cell: ({ row }) => {
            const role = row.getValue("role") as string;
            const isAdmin = role === "Admin";

            return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {role}
                </span>
            )
        },
    },
    {
        accessorKey: "last_login",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Last Login" />
        ),
        cell: ({ row }) => {
            const value: string = row.getValue("last_login");
            return dayjs(value).format("DD/MM/YY hh:mm A")
        },
        enableGlobalFilter: false,
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
        },
        enableGlobalFilter: false,
    }
]
