
import { Calendar } from "@/components/ui/calendar"
import { Field, } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { useState, useEffect } from "react"

// Helper hook to track screen size matching Tailwind's breakpoints
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query)
        // Set initial value
        setMatches(media.matches)

        // Listen for resize events
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
        media.addEventListener("change", listener)

        return () => media.removeEventListener("change", listener)
    }, [query])

    return matches
}


export function DatePickerInput({ date, setDate }: { date: Dayjs, setDate: React.Dispatch<React.SetStateAction<Dayjs>> }) {
    const [open, setOpen] = useState(false)
    const [month, setMonth] = useState<Date | undefined>(date.toDate())
    const [inputValue, setInputValue] = useState(date.format("DD MMM YY")) // temp value to store inputs
    const isLargeScreen = useMediaQuery("(min-width: 640px)")
    const dateFormat = isLargeScreen ? "DD MMMM YYYY" : "DD MMM YY"

    useEffect(() => {
        setInputValue(date.format("DD MMM YY"))
        setMonth(date.toDate());
    }, [date])

    const handleCommit = () => {
        const parsed = dayjs(inputValue)
        if (parsed.isValid()) {
            setDate(parsed)
            setMonth(parsed.toDate())
            setInputValue(parsed.format(dateFormat)) // Format nicely
        } else {
            // Revert to last valid date if input is garbage
            setInputValue(date.format(dateFormat))
        }
    }


    useEffect(() => {
        setInputValue(date.format(dateFormat))
        setMonth(date.toDate());
    }, [date, dateFormat])

    return (
        <Field className="mx-auto w-32 sm:w-48">
            <InputGroup>
                <InputGroupInput
                    id="date-required"
                    className="font-semibold text-center text-sky-900 dark:text-sky-100"
                    value={inputValue}
                    placeholder="06 Jul 2025"
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleCommit}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault()
                            setOpen(true)
                        }
                        if (e.key === "Enter") {
                            handleCommit()
                        }
                    }}

                />
                <InputGroupAddon align="inline-end">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger render={<InputGroupButton id="date-picker" variant="ghost" size="icon-xs" aria-label="Select date"><CalendarIcon /><span className="sr-only">Select date</span></InputGroupButton>} />
                        <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                            alignOffset={-8}
                            sideOffset={10}
                        >
                            <Calendar
                                mode="single"
                                selected={date.toDate()}
                                month={month}
                                onMonthChange={setMonth}
                                onSelect={(date) => {
                                    setDate(dayjs(date))
                                    setOpen(false)
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </InputGroupAddon>
            </InputGroup>
        </Field>
    )
}
