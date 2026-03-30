import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
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
import { UserRoleLevel } from "@/models/user";
import { useBookingDuration } from "@/hooks/use-booking-durations";

export const bookingFormSchema = z.object({
  title: z.string().max(25).min(1, "Title cannot be empty"),
  room_id: z.string(),
  description: z.string().max(300).optional(),
  start_time: z.instanceof(dayjs as unknown as typeof Dayjs),
  duration: z.int().min(1).max(36),
})

// 36 slots * 30 mins = 18 hours. 08:00 + 18h = 02:00 AM (Next Day)
export const TOTAL_BOOKING_SLOTS = 36;

export default function NewBookingForm({ room, time, onSuccess }: { room: Room, time: Dayjs, onSuccess: (msg: string) => void }) {
  // 1. Setup Grid Constants
  // Grid starts at 8:00 AM of the selected day
  const gridStartTime = useMemo(() => {
    let startTime = time.hour(8).minute(0).second(0);

    // Check if the time selected is between 12am and 2am.
    // If so, adjust the grid start time to the previous business day
    if (time.hour() >= 0 && time.hour() < 3) {
      startTime = startTime.subtract(1, 'day')
    }
    return startTime;
  }, [time]);


  // Generate valid start times
  const TIME_SLOTS: Array<Dayjs> = useMemo(() =>
    Array.from({ length: TOTAL_BOOKING_SLOTS }, (_, i) => gridStartTime.add(i * 30, "minute")),
    [gridStartTime]);

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

  const durationOptions = useBookingDuration(watchedStartTime, gridStartTime, user?.level)

  // Safety clamp to ensure that duration cannot exceed maximum allowed.
  useEffect(() => {
    if (durationOptions.length === 0)
      return;

    const maxAvailable = Math.max(...durationOptions);
    if (watchedDuration > maxAvailable) {
      form.setValue("duration", maxAvailable);
    }
  }, [watchedStartTime, durationOptions, watchedDuration, form])


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
                    <SelectValue render={<div>{Rooms.find((room) => room.room_id == field.value)?.display_name}</div>} />
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
          <Field className="grid grid-cols-3 items-center">
            <FieldLabel htmlFor="start_time">Date</FieldLabel>
            <Controller
              name="start_time"
              control={form.control}
              render={({ field }) => (
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
              )}
            />
          </Field>

          <Field className="grid grid-cols-3 items-center">
            <FieldLabel htmlFor="start_time">Start time</FieldLabel>
            <Controller
              name="start_time"
              control={form.control}
              render={({ field }) => (
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
              )}
            />
          </Field>

          <Field className="grid grid-cols-3">
            <FieldLabel htmlFor="duration"> End time {user?.level === UserRoleLevel.Default && "(Max 3 hours per day)"}</FieldLabel>
            <Controller
              name="duration"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  name={field.name}
                >
                  <SelectTrigger className={"col-span-2"}>
                    <SelectValue>
                      {watchedStartTime.add(watchedDuration * 30, 'minutes').format("hh:mm A")}
                      <span className="ml-1 text-muted-foreground">
                        ({watchedDuration * 0.5} hour{watchedDuration > 2 ? 's' : ''})
                      </span>
                    </SelectValue>

                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((duration) => (
                      <SelectItem key={duration} value={duration}>
                        {watchedStartTime.add(duration * 30, 'minutes').format("hh:mm A")}
                        <span className="ml-2 text-muted-foreground">
                          ({duration * 0.5} hour{duration > 2 && 's'})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="submit" >Save booking</Button>
        </DialogFooter>
      </form>
    </DialogContent >
  )
}

