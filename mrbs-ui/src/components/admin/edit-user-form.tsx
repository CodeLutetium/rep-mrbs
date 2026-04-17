import { UserRoleLevel, type UserData } from "@/models/user"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label"
import { useForm, Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { editUser } from "@/services/user-service"
import { HttpStatusCode } from "axios"
import { toast } from "sonner"
import { useAdmin } from "@/context/admin-context"

export const editUserSchema = z.object({
  user_id: z.number(),
  display_name: z.string().min(1, "Display name cannot be empty").max(255),
  name: z.string().min(1, "Username cannot be empty").max(255),
  email: z.email(),
  level: z.number().min(0)
})

export default function EditUserForm({ user, onSubmit }: { user: UserData, onSubmit: () => void }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { refresh } = useAdmin();

  const form = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      user_id: user.user_id,
      display_name: user.display_name,
      name: user.name,
      email: user.email,
      level: user.level,
    }
  })

  // Reset form state on dialog close 
  useEffect(() => {
    if (!user) {
      return;
    }

    form.reset({
      user_id: user.user_id,
      display_name: user.display_name,
      name: user.name,
      email: user.email,
      level: user.level,
    });
  }, [user, form, refresh]);

  const { isDirty } = form.formState;

  // Submit form to the backend
  const executeSubmit = async (data: z.infer<typeof editUserSchema>) => {
    try {
      const res = await editUser(data);
      if (res.status === HttpStatusCode.Ok) {
        toast.info(res.data.message);
        setIsConfirmOpen(false);
        onSubmit();
      } else {
        toast.error(res.data.error);
      }
    } catch (error) {
      toast.error("Error receiving data from backend");
    }
  };


  async function handleSubmit(data: z.infer<typeof editUserSchema>) {

    if (data.level !== user.level) {
      setIsConfirmOpen(true);
      return;
    }

    await executeSubmit(data);
  }

  // Block edits to MRBS_ADMIN
  if (user.name === "MRBS_ADMIN") return;

  return (
    <DialogContent className={"sm:max-w-106.25"}>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>Edit details of existing user</DialogDescription>

      </DialogHeader>
      <form className="grid gap-4 py-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Field className="grid grid-cols-3 items-center">
          <FieldLabel>
            Display name
          </FieldLabel>
          <div className="col-span-2">
            <Input
              {...form.register("display_name")}
              className={form.formState.errors.display_name ? "border-red-500" : ""}
            />
            {form.formState.errors.display_name && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.display_name.message}
              </p>
            )}
          </div>
        </Field>

        <Field className="grid grid-cols-3 items-center">
          <FieldLabel title="Username is case-sensitive">
            Username
          </FieldLabel>
          <div className="col-span-2">
            <Input
              {...form.register("name")}
              className={form.formState.errors.name ? "border-red-500" : ""}
            />
            {
              form.formState.errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )
            }
          </div>
        </Field>


        <Field className="grid grid-cols-3 items-center">
          <FieldLabel>
            Email
          </FieldLabel>
          <div className="col-span-2">
            <Input
              {...form.register("email")}
              className={form.formState.errors.email ? "border-red-500" : ""}
            />
            {
              form.formState.errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )
            }
          </div>
        </Field>

        {/** Set admin level */}
        <Field className="grid grid-cols-3 items-start gap-4">
          <FieldLabel className="text-right">Role</FieldLabel>
          <div className="col-span-2">
            <Controller
              control={form.control}
              name="level"
              render={({ field }) => (
                <RadioGroup
                  value={String(field.value)}
                  onValueChange={(value) => field.onChange(Number(value))}
                  className="flex flex-row space-x-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={UserRoleLevel.Default.toString()} id="role-student" />
                    <Label htmlFor="role-student" className="font-normal">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={UserRoleLevel.Admin.toString()} id="role-admin" />
                    <Label htmlFor="role-admin" className="font-normal">Admin</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
        </Field>

        {/** Read only fields */}
        <Field className="grid grid-cols-3 items-center gap-4">
          <FieldLabel>Date created</FieldLabel>
          <Input
            value={dayjs(user.time_created).format("DD/MM/YY hh:mm A")}
            disabled
            className="col-span-2"
          />
        </Field>

        <Field className="grid grid-cols-3 items-center gap-4">
          <FieldLabel>Last login</FieldLabel>
          <Input
            value={dayjs(user.last_login).format("DD/MM/YY hh:mm A")}
            disabled
            className="col-span-2"
          />
        </Field>


        <DialogFooter>
          <Button type="button" variant={"outline"} onClick={() => form.reset()} >Discard changes</Button>
          <Button type="submit" disabled={!isDirty}>Save changes</Button>
        </DialogFooter>
      </form >

      {/* Warning Dialog for promotions and demotions */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{
              form.getValues("level") === UserRoleLevel.Admin ? "Promote user to admin?" : "Revoke admin privileges from user?"
            }</AlertDialogTitle>
            <AlertDialogDescription>
              {form.getValues("level") === UserRoleLevel.Admin
                ? "Promoting this user to Admin will grant them full access to system settings and user management."
                : "Demoting this user to Student will revoke their administrative privileges immediately."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => form.reset({ "level": user.level })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await executeSubmit(form.getValues())
              }
              }
              variant={"destructive"}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent >

  )
}
