import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { Dayjs } from "dayjs";
import * as z from "zod"
import { type Room } from "@/models/rooms";
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Textarea } from "./ui/textarea";
import { useUser } from "@/context/user-context";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { newBooking, type NewBookingResponse } from "@/services/booking-service";

export const bookingFormSchema = z.object({
    title: z.string().max(25).min(1, "Title cannot be empty"),
    room_id: z.string(),
    description: z.string().max(300).optional(),
    start_time: z.instanceof(dayjs as unknown as typeof Dayjs),
    duration: z.int().min(1).max(6),
})


export default function NewBookingForm({ room, time, onSuccess }: { room: Room, time: Dayjs, onSuccess: () => void }) {
    const user = useUser()
    const [open, setOpen] = useState(false);
    const currDate = time.set("hour", 8).set("minute", 0).set("second", 0)
    const TIME_SLOTS: Array<Dayjs> = Array.from({ length: 36 }, (_, i) => { return currDate.add(i * 30, "minute") })
    const durationOptions: Array<number> = [...Array(6)].map((_, i) => i + 1)

    async function onSubmit(values: z.infer<typeof bookingFormSchema>) {
        try {
            const booking: NewBookingResponse = await newBooking(values)

            if (booking.booking_id) {
                onSuccess()
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
            start_time: time,
            duration: 2, // 1 hour
        }
    })

    useEffect(() => {
        form.reset({
            title: "",
            room_id: room.room_id,
            description: user?.display_name,
            start_time: time, // The new time prop
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

    return (
        <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
                <DialogTitle>New Booking</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 py-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
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
                                    area-invalid={fieldState.invalid}
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
                                    area-invalid={fieldState.invalid}
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
                    <div className=" flex flex-row">
                        <FieldLabel htmlFor="start_time">Start</FieldLabel>
                        <Controller
                            name="start_time"
                            control={form.control}
                            render={({ field }) => (
                                <Field>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger>
                                            <Button variant={"outline"} className={"w-32 justify-between font-normal"}>
                                                {field.value.format("DD MMM YYYY")}
                                                <CalendarIcon />
                                            </Button>

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
                                    <Select onValueChange={field.onChange} value={field.value.format("hh:mm A")} name={field.name}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_SLOTS.map((slot) => (
                                                <SelectItem value={slot}>{slot.format("hh:mm A")}</SelectItem>
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
                                <Select onValueChange={field.onChange} value={`${field.value * 0.5} hour${field.value > 2 ? 's' : ''} (${form.getValues("start_time").add(field.value * 30, 'minutes').format("hh:mm A")})`} name={field.name}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {
                                            durationOptions.map((duration) =>
                                                <SelectItem value={duration}>
                                                    <>
                                                        {form.getValues("start_time").add(duration * 30, 'minutes').format("hh:mm A")}
                                                        <span className="text-gray-800 dark:text-gray-200">
                                                            ({duration * 0.5} hour{duration > 2 && 's'})
                                                        </span>
                                                    </>
                                                </SelectItem>)
                                        }

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
        </DialogContent>
    )
}

