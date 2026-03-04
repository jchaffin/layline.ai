"use client"

import * as React from "react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/EnhancedCalendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Select date",
  disabled = false,
  className,
}: DatePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <ReactDatePicker
        selected={date}
        onChange={(selectedDate: Date | null) => onDateChange?.(selectedDate || undefined)}
        dateFormat="MM/yyyy"
        showMonthYearPicker
        placeholderText={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        wrapperClassName="w-full"
        popperClassName="z-50"
      />
    </div>
  )
}

interface DateRangePickerProps {
  from?: Date
  to?: Date
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  from,
  to,
  onDateRangeChange,
  placeholder = "Pick date range",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<{
    from?: Date
    to?: Date
  }>({
    from,
    to,
  })

  React.useEffect(() => {
    setDate({ from, to })
  }, [from, to])

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    const newRange = range || {}
    setDate(newRange)
    onDateRangeChange?.(newRange)
    // Close popover when both dates are selected
    if (newRange.from && newRange.to) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={{ from: date?.from, to: date?.to }}
          onSelect={handleSelect}
          numberOfMonths={2}
          className="bg-white dark:bg-gray-800"
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateTimePickerProps {
  date?: Date | null
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
}

/** Picker for date + time (e.g. interview scheduling). Uses calendar + time dropdown. */
export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Pick date and time",
  disabled = false,
  className,
  minDate,
}: DateTimePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <ReactDatePicker
        selected={date ?? undefined}
        onChange={(selected: Date | null) => onDateChange?.(selected ?? undefined)}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="MMM d, yyyy h:mm aa"
        placeholderText={placeholder}
        disabled={disabled}
        minDate={minDate}
        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:cursor-not-allowed"
        wrapperClassName="w-full"
        popperClassName="z-50"
      />
    </div>
  )
}