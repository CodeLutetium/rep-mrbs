import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button, buttonVariants } from "./ui/button";
import type { Dayjs } from "dayjs";
import * as z from "zod"
import { Rooms, type Room } from "@/models/rooms";
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Textarea } from "./ui/textarea";
import { useUser } from "@/context/user-context";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { newBooking } from "@/services/booking-service";
import { toast } from "sonner";
import { HttpStatusCode, type AxiosResponse } from "axios";
import { cn } from "@/lib/utils";

export const bookingFormSchema = z.object({
    title: z.string().max(25).min(1, "Title cannot be empty"),
    room_id: z.string(),
    description: z.string().max(300).optional(),
    start_time: z.instanceof(dayjs as unknown as typeof Dayjs),
    duration: z.int().min(1).max(6),
})


export default function NewBookingForm({ room, time, onSuccess }: { room: Room, time: Dayjs, onSuccess: (msg: string) => void }) {
    // 1. Setup Grid Constants
    // Grid starts at 8:00 AM of the selected day
    const gridStartTime = useMemo(() => time.hour(8).minute(0).second(0), [time]);
    // 36 slots * 30 mins = 18 hours. 08:00 + 18h = 02:00 AM (Next Day)
    const TOTAL_SLOTS = 36;

    // Generate valid start times
    const TIME_SLOTS: Array<Dayjs> = useMemo(() =>
        Array.from({ length: TOTAL_SLOTS }, (_, i) => gridStartTime.add(i * 30, "minute")),
        [gridStartTime]);

    // Base duration options (1 to 6 blocks)
    const baseDurationOptions = [1, 2, 3, 4, 5, 6];

    const user = useUser()
    const [open, setOpen] = useState(false);


    async function onSubmit(values: z.infer<typeof bookingFormSchema>) {
        try {
            const res: AxiosResponse = await newBooking(values)

            if (res.status == HttpStatusCode.Created) {
                onSuccess(res.data.message)
            } else {
                toast.error(res.data.error)
            }
        } catch (err) {
            console.error(err);
        }
    }

    const form = useForm<z.infer<typeof bookingFormSchema>>({
        resolver: zodResolver(bookingFormSchema),
        defaultValues: {
            title: "",
            room_id: room.room_id,
            description: user?.display_name,
            start_time: TIME_SLOTS.find((t) => t.toISOString() == time.toISOString()),
            duration: 2, // 1 hour
        }
    })

    // Clear form state if user closes form.
    useEffect(() => {
        const matchingSlotReference = TIME_SLOTS.find((slot) => slot.isSame(time, 'minute'));

        form.reset({
            title: "",
            room_id: room.room_id,
            description: user?.display_name,
            start_time: matchingSlotReference || time,
            duration: 2,
        });
    }, [time, room, user, form]);

    // Helper to update only the Date portion
    const setDateOnly = (date: Date | undefined) => {
        if (!date) return
        const currentFullDate = form.getValues("start_time")
        const newDate = dayjs(date).hour(currentFullDate.hour()).minute(currentFullDate.minute())
        form.setValue("start_time", newDate)
    }

    const watchedStartTime = form.watch("start_time")
    const watchedDuration = form.watch("duration")

    // Generate durations before 2am.
    const availableDurations = useMemo(() => {
        if (!watchedStartTime) return baseDurationOptions;

        const diffInMinutes = watchedStartTime.diff(gridStartTime, 'minute');
        const currentSlotIndex = Math.floor(diffInMinutes / 30);

        // Slots remaining until 2:00 AM
        const slotsRemaining = TOTAL_SLOTS - currentSlotIndex;

        // Filter options that would exceed 2:00 AM
        return baseDurationOptions.filter(d => d <= slotsRemaining);
    }, [watchedStartTime, gridStartTime]);

    // Safety Clamp
    // If user selected "3 hours" at 8:00 PM, then moved time to 1:30 AM, 
    // "3 hours" is now invalid. We must force-reduce it.
    useEffect(() => {
        const maxDuration = Math.max(...availableDurations);
        if (watchedDuration > maxDuration) {
            form.setValue("duration", maxDuration);
        }
    }, [watchedStartTime, availableDurations, watchedDuration, form]);


    return (
        <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
                <DialogTitle>New Booking</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 py-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                    <Controller
                        name="room_id"
                        control={form.control}
                        render={({ field }) => (
                            <Field>
                                <FieldLabel htmlFor="room">Room</FieldLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    name={field.name}
                                >
                                    <SelectTrigger>
                                        <SelectValue render={<div>{Rooms[Number(field.value) - 1].display_name}</div>} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Rooms.map((room) => <SelectItem value={room.room_id}>{room.display_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}

                    />
                    <Controller
                        name="title"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel htmlFor="title">Title</FieldLabel>
                                <Input
                                    {...field}
                                    id="title"
                                    type="text"
                                    required
                                    placeholder="Purpose of booking"
                                    aria-required
                                />
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />

                    <Controller
                        name="description"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel htmlFor="description">Description</FieldLabel>
                                <Textarea
                                    {...field}
                                    id="description"
                                    placeholder=""
                                    rows={3}
                                />
                                <FieldDescription className="text-xs">
                                    People involved (names and batch)
                                </FieldDescription>
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        )}
                    />

                    {/* Calendar and time*/}
                    <div className="flex flex-row">
                        <FieldLabel htmlFor="start_time">Start</FieldLabel>
                        <Controller
                            name="start_time"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger>
                                            <div className={cn(buttonVariants({ variant: "outline" }), "w-32 justify-between font-normal")}>
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
                                </Field>
                            )}
                        />

                        <Controller
                            name="start_time"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        name={field.name}
                                    >
                                        <SelectTrigger>
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
                                </Field>
                            )}
                        />
                    </div>

                    <Controller
                        name="duration"
                        control={form.control}
                        render={({ field }) => (
                            <Field>
                                <Label>Duration (max 3 hours)</Label>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    name={field.name}
                                >
                                    <SelectTrigger>
                                        <SelectValue>
                                            {watchedDuration * 0.5} hour{watchedDuration > 2 ? 's' : ''}
                                            <span className="ml-1 text-muted-foreground">
                                                ({watchedStartTime.add(watchedDuration * 30, 'minutes').format("hh:mm A")})
                                            </span>
                                        </SelectValue>

                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDurations.map((duration) => (
                                            <SelectItem key={duration} value={duration}>
                                                {duration * 0.5} hour{duration > 2 && 's'}
                                                <span className="ml-2 text-muted-foreground">
                                                    ({watchedStartTime.add(duration * 30, 'minutes').format("hh:mm A")})
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    />
                </FieldGroup>
                <DialogFooter>
                    <Button type="submit" >Save booking</Button>
                </DialogFooter>
            </form>
        </DialogContent >
    )
}

