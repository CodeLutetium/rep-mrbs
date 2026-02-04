import type { Booking } from "@/models/booking";
import { DialogContent, DialogFooter, DialogHeader } from "./ui/dialog";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import dayjs from "dayjs";
import { useUser } from "@/context/user-context";
import { Button } from "./ui/button";
import { Trash } from "lucide-react"
import { deleteBooking } from "@/services/booking-service";
import { HttpStatusCode } from "axios";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTrigger } from "./ui/alert-dialog";

export default function BookingDialog({ booking, onDelete }: { booking: Booking, onDelete: () => void }) {
    const user = useUser();
    const isBookingOwner = user?.name == booking.booked_by_username; // true if current user is the one who made this booking.

    async function handleDelete() {
        try {
            const res = await deleteBooking(booking.booking_id);
            if (res.status == HttpStatusCode.Ok) {
                toast.info(res.data.message);
                onDelete();
            } else {
                toast.error(res.data.error);
            }
        } catch (error) {
            console.error(error);
        }
    }


    return (
        <DialogContent className={"sm:max-w-106.25"}>
            <DialogHeader>Booking Details</DialogHeader>
            <div className="grid gap-4 py-4">
                <FieldGroup>
                    <InlineLabelInput label="Room" value={booking.room_name} />

                    <Field className="grid grid-cols-3 items-center">
                        <FieldLabel>
                            Booked by
                        </FieldLabel>
                        <Input className="col-span-2" value={booking.booked_by} disabled />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="title">
                            Title
                        </FieldLabel>
                        <Input value={booking.title} disabled />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="description">
                            Description
                        </FieldLabel>
                        <Textarea rows={3} value={booking.description} disabled />
                    </Field>

                    <Field>
                        <FieldLabel>Date</FieldLabel>
                        <Input value={dayjs(booking.start_time).format("DD MMM YYYY")} disabled />
                    </Field>

                    <Field className="grid grid-cols-3 items-center">
                        <FieldLabel>
                            Start time
                        </FieldLabel>
                        <Input className="col-span-2" value={dayjs(booking.start_time).format("hh:mm A")} disabled />
                    </Field>

                    <InlineLabelInput label="End Time" value={dayjs(booking.end_time).format("hh:mm A")} />

                </FieldGroup>

                {isBookingOwner &&
                    <AlertDialog>
                        <AlertDialogTrigger className={"place-self-end"}>
                            <Button variant={"outline"} size={"icon"} className={"cursor-pointer "} title="Delete booking">
                                <Trash />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>Delete booking?</AlertDialogHeader>
                            <AlertDialogDescription>
                                Do you want to cancel your booking for <b>{booking.room_name}</b> on <b>{dayjs(booking.start_time).format("DD MMM YYYY")}</b> from <> </>
                                <b>{dayjs(booking.start_time).format("hh:mm A")}</b> to <b>{dayjs(booking.end_time).format("hh:mm A")}</b>?
                            </AlertDialogDescription>
                            <DialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Delete booking</AlertDialogAction>
                            </DialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                }
            </div>

        </DialogContent>
    )
}

// Show label and disabled input in the same line.
function InlineLabelInput({ label, value }: { label: string, value: string }) {
    return (
        <Field className="grid grid-cols-3">
            <FieldLabel>{label}</FieldLabel>
            <Input className="col-span-2" value={value} disabled />
        </Field>
    )
}
