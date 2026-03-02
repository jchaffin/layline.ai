"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface SimpleDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowFuture?: boolean;
}

import { MONTHS } from "@/lib/constants";

function toDate(v: Date | string | undefined): Date | undefined {
  if (!v) return undefined;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export default function SimpleDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  allowFuture = true,
}: SimpleDatePickerProps) {
  const safeValue = toDate(value);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [selectedYear, setSelectedYear] = React.useState<string>("");

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    const list: number[] = [];
    const startYear = 1950;
    const endYear = allowFuture ? currentYear + 10 : currentYear;
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear, allowFuture]);

  React.useEffect(() => {
    if (safeValue) {
      setSelectedMonth(format(safeValue, "MM"));
      setSelectedYear(format(safeValue, "yyyy"));
    } else {
      setSelectedMonth("");
      setSelectedYear("");
    }
  }, [safeValue?.getTime()]);

  const handleSelect = () => {
    if (!selectedMonth || !selectedYear) return;
    
    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10) - 1;
    const date = new Date(year, month, 1);
    
    onChange?.(date);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedMonth("");
    setSelectedYear("");
    onChange?.(undefined);
    setIsOpen(false);
  };

  const displayValue = safeValue ? format(safeValue, "MMM yyyy") : "";

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !safeValue && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Month
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Year
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSelect}
                disabled={!selectedMonth || !selectedYear}
                className="flex-1"
              >
                Select
              </Button>
              {safeValue && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
