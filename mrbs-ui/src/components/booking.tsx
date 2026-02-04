import type { Booking } from "@/models/booking";
import { DialogContent, DialogHeader } from "./ui/dialog";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import dayjs from "dayjs";

export default function BookingDialog({ booking }: { booking: Booking }) {

    return (
        <DialogContent className={"sm:max-w-106.25"}>
            <DialogHeader>Booking Details</DialogHeader>
            <div className="grid gap-4 py-4">
                <FieldGroup>
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

                    <InlineLabelInput label="End Time" value={dayjs(booking.end_time).format("hh: mm A")} />

                </FieldGroup>
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
