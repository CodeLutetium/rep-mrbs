import type { UserData } from "@/models/user"
import { type ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs";

import { DataTableColumnHeader } from "./table/data-table-column-header";
import { DataTableRowActions } from "./table/data-row-actions";

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
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableGlobalFilter: false,
  }
]
