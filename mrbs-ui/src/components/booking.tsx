import type { Booking } from "@/models/booking";
import { DialogContent, DialogFooter, DialogHeader } from "./ui/dialog";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import dayjs, { Dayjs } from "dayjs";
import { useUser } from "@/context/user-context";
import { Button, buttonVariants } from "./ui/button";
import { Trash } from "lucide-react"
import { deleteBooking } from "@/services/booking-service";
import { HttpStatusCode } from "axios";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTrigger } from "./ui/alert-dialog";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Rooms } from "@/models/rooms";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./ui/calendar";

const editBookingSchema = z.object({
    title: z.string().min(1, "Title cannot be empty!").max(25),
    room_id: z.string(),
    description: z.string().max(250).optional(),
    start_time: z.instanceof(dayjs as unknown as typeof Dayjs),
    duration: z.int().min(1).max(6),
})

export default function BookingDialog({ booking, onDelete }: { booking: Booking, onDelete: () => void }) {
    const user = useUser();
    const isBookingOwner = user?.name == booking.booked_by_username; // true if current user is the one who made this booking.


    // For changing the start time
    const dayStartTime = useMemo(() => dayjs(booking.start_time).hour(8).minute(0).second(0), [booking.start_time]);
    const TOTAL_SLOTS = 36;
    // Generate valid start times
    const TIME_SLOTS: Array<Dayjs> = useMemo(() =>
        Array.from({ length: TOTAL_SLOTS }, (_, i) => dayStartTime.add(i * 30, "minute")),
        [dayStartTime]);

    const form = useForm<z.infer<typeof editBookingSchema>>({
        resolver: zodResolver(editBookingSchema),
        defaultValues: {
            title: booking.title,
            description: booking.description,
            room_id: booking.room_id,
            start_time: TIME_SLOTS.find((t) => t.toISOString() == dayjs(booking.start_time).toISOString()),
            duration: Math.round(dayjs(booking.end_time).diff(dayjs(booking.start_time), 'minute') / 30),
        }
    })

    // Clear form state when opening new form.
    useEffect(() => {
        if (!booking) return;

        const matchingSlotReference = TIME_SLOTS.find((t) =>
            t.toISOString() === dayjs(booking.start_time).toISOString()
        );

        form.reset({
            title: booking.title,
            description: booking.description,
            room_id: booking.room_id,
            start_time: matchingSlotReference || TIME_SLOTS.find((t) => t.toISOString() == dayjs(booking.start_time).toISOString()),
            duration: Math.round(dayjs(booking.end_time).diff(dayjs(booking.start_time), 'minute') / 30),
        });
    }, [booking, user, form, TIME_SLOTS]);


    const { isDirty, isValid } = form.formState;
    const watchedStartTime = form.watch("start_time")
    const watchedDuration = form.watch("duration")

    const baseDurationOptions = [1, 2, 3, 4, 5, 6];
    // Generate durations before 2am.
    const availableDurations = useMemo(() => {
        if (!watchedStartTime) return baseDurationOptions;

        const diffInMinutes = watchedStartTime.diff(dayStartTime, 'minute');
        const currentSlotIndex = Math.floor(diffInMinutes / 30);

        // Slots remaining until 2:00 AM
        const slotsRemaining = TOTAL_SLOTS - currentSlotIndex;

        // Filter options that would exceed 2:00 AM
        return baseDurationOptions.filter(d => d <= slotsRemaining);
    }, [watchedStartTime, dayStartTime]);

    // Safety Clamp
    // If user selected "3 hours" at 8:00 PM, then moved time to 1:30 AM, 
    // "3 hours" is now invalid. We must force-reduce it.
    useEffect(() => {
        if (availableDurations.length === 0) return;
        const maxDuration = Math.max(...availableDurations);
        if (watchedDuration > maxDuration) {
            form.setValue("duration", maxDuration);
        }
    }, [watchedStartTime, availableDurations, watchedDuration, form]);


    const onSubmit = () => {

    }


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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FieldGroup>
                    {/* Room  */}
                    <Field className="grid grid-cols-3 items-center">
                        <FieldLabel>
                            Room
                        </FieldLabel>
                        {
                            isBookingOwner ? (
                                <Controller
                                    control={form.control}
                                    name="room_id"
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            name={field.name}
                                        >
                                            <SelectTrigger className={"col-span-2"}>
                                                <SelectValue render={<div>{Rooms[Number(field.value) - 1].display_name}</div>} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Rooms.map((room) => <SelectItem value={room.room_id}>{room.display_name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            ) : (
                                <Input className="col-span-2" value={booking.room_name} disabled />
                            )
                        }
                    </Field>

                    {/* Booking owner: non-editable. */}
                    <Field className="grid grid-cols-3 items-center">
                        <FieldLabel>
                            Booked by
                        </FieldLabel>
                        <Input
                            className="col-span-2"
                            value={booking.booked_by}
                            disabled />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="title">
                            Title
                        </FieldLabel>
                        <Input
                            {...form.register("title")}
                            disabled={!isBookingOwner}
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="description">
                            Description
                        </FieldLabel>
                        <Textarea
                            {...form.register("description")}
                            rows={3}
                            disabled={!isBookingOwner}
                        />
                    </Field>

                    <Field className="grid grid-cols-3 items-center">
                        <FieldLabel>Date</FieldLabel>
                        {
                            isBookingOwner ? (
                                <Controller
                                    control={form.control}
                                    name="start_time"
                                    render={({ field }) => {
                                        const [open, setOpen] = useState(false);
                                        const setDateOnly = (date: Date | undefined) => {
                                            if (!date) return
                                            const currentFullDate = form.getValues("start_time")
                                            const newDate = dayjs(date).hour(currentFullDate.hour()).minute(currentFullDate.minute())
                                            form.setValue("start_time", newDate)
                                        }

                                        return (
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger className={"col-span-2"}>
                                                    <div className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between font-normal")}>
                                                        {field.value.format("DD MMM YYYY")}
                                                        <CalendarIcon />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value.toDate()}
                                                        captionLayout="dropdown"
                                                        onSelect={setDateOnly}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )
                                    }
                                    }
                                />
                            ) : (
                                <Input className="col-span-2" value={dayjs(booking.start_time).format("DD MMM YYYY")} disabled />
                            )
                        }
                    </Field>

                    <Field className="grid grid-cols-3 items-center">
                        <FieldLabel>
                            Start time
                        </FieldLabel>
                        {isBookingOwner ? (
                            <Controller
                                name="start_time"
                                control={form.control}
                                render={({ field }) => {
                                    return (
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            name={field.name}
                                        >
                                            <SelectTrigger className={"col-span-2"}>
                                                <SelectValue render={<div>{field.value.format("hh:mm A")}</div>} />
                                            </SelectTrigger>
                                            <SelectContent >
                                                {TIME_SLOTS.map((slot) => (
                                                    <SelectItem value={slot} key={slot.format("hh:mm A")}>
                                                        {slot.format("hh:mm A")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )
                                }
                                }
                            />
                        ) : (
                            <Input className="col-span-2" value={dayjs(booking.start_time).format("hh:mm A")} disabled />
                        )}
                    </Field>

                    <Field className="grid grid-cols-3 items-center">
                        <FieldLabel>
                            End time
                        </FieldLabel>
                        {isBookingOwner ? (
                            <Controller
                                name="duration"
                                control={form.control}
                                render={({ field }) => {
                                    return (
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            name={field.name}
                                        >
                                            <SelectTrigger className={"col-span-2"}>
                                                <SelectValue render={<div>{watchedStartTime.add(watchedDuration * 30, 'minutes').format("hh:mm A")}</div>} />
                                            </SelectTrigger>
                                            <SelectContent >
                                                {availableDurations.map((duration) => (
                                                    <SelectItem key={duration} value={duration}>
                                                        {watchedStartTime.add(duration * 30, 'minutes').format("hh:mm A")}
                                                        <span className="ml-2 text-muted-foreground">
                                                            ({duration * 0.5} hour{duration > 2 && 's'})
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )
                                }
                                }
                            />
                        ) : (
                            <Input className="col-span-2" value={dayjs(booking.start_time).format("hh:mm A")} disabled />
                        )}
                    </Field>

                </FieldGroup>

                <DialogFooter className="flex flex-row justify-between sm:justify-between items-center w-full">
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
                    {
                        isBookingOwner && (
                            <Button type="submit" disabled={!isDirty || !isValid}>
                                Save Changes
                            </Button>
                        )
                    }
                </DialogFooter >
            </form >

        </DialogContent >
    )
}

