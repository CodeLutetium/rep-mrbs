
import * as React from "react"
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

export function DatePickerInput({ date, setDate }: { date: Dayjs, setDate: React.Dispatch<React.SetStateAction<Dayjs>> }) {
    const [open, setOpen] = React.useState(false)
    const [month, setMonth] = React.useState<Date | undefined>(date.toDate())
    const [inputValue, setInputValue] = React.useState(date.format("DD MMMM YYYY")) // temp value to store inputs

    React.useEffect(() => {
        setInputValue(date.format("DD MMMM YYYY"))
        setMonth(date.toDate());
    }, [date])

    const handleCommit = () => {
        const parsed = dayjs(inputValue)
        if (parsed.isValid()) {
            setDate(parsed)
            setMonth(parsed.toDate())
            setInputValue(parsed.format("DD MMMM YYYY")) // Format nicely
        } else {
            // Revert to last valid date if input is garbage
            setInputValue(date.format("DD MMMM YYYY"))
        }
    }

    return (
        <Field className="mx-auto w-48">
            <InputGroup>
                <InputGroupInput
                    id="date-required"
                    className="font-semibold text-center text-sky-900 dark:text-sky-100"
                    value={inputValue}
                    placeholder="06 July 2025"
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
