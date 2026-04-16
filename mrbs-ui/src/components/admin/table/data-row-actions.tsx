import type { UserData } from "@/models/user";
import { deleteUser } from "@/services/user-service";
import type { Row } from "@tanstack/react-table";
import { HttpStatusCode } from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdmin } from "@/context/admin-context";

interface DataTableRowActionsProps {
  row: Row<UserData>;
}

export const DataTableRowActions = ({ row }: DataTableRowActionsProps) => {
  const user: UserData = row.original;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { refreshUserData } = useAdmin();

  async function handleDelete() {
    try {
      const res = await deleteUser(user.name)
      if (res.status === HttpStatusCode.Ok) {
        toast.info(res.data.message);
        refreshUserData();
      } else {
        toast.error(res.data.error);
      }
    } catch (error) {
      toast.error("An unknown error has occured.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant={"ghost"} className={"h-8 w-8 p-0"}>
            <MoreHorizontal />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            navigator.clipboard.writeText(user.email)
            toast.success("Email copied to clipboard")
          }}>
            Copy email
          </DropdownMenuItem>

          <DropdownMenuSeparator />


          <DropdownMenuItem>Edit Details</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600" onClick={() => setIsDeleteDialogOpen(true)}>Delete User</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for {user.display_name} and all related bookings. This action is IRREVERSIBLE!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >
    </>
  )
}
