"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger, 
} from "@/components/ui/Popover";

interface SimpleDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowFuture?: boolean;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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
  const currentYear = new Date().getFullYear();
  const maxYear = allowFuture ? currentYear + 5 : currentYear;

  const [viewYear, setViewYear] = React.useState(() =>
    safeValue ? safeValue.getFullYear() : currentYear,
  );
  const [yearOpen, setYearOpen] = React.useState(false);
  const yearListRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (yearOpen && yearListRef.current) {
      const active = yearListRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: "center" });
    }
  }, [yearOpen]);

  const selectedMonth = safeValue?.getMonth();
  const selectedYear = safeValue?.getFullYear();

  const handleSelect = (monthIndex: number) => {
    onChange?.(new Date(viewYear, monthIndex, 1));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.(undefined);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              !safeValue && "text-muted-foreground",
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
            <span className="text-sm">
              {safeValue ? format(safeValue, "MMM yyyy") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 !bg-white !text-gray-900 !border-gray-200" align="start">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => Math.max(1950, y - 1))}
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setYearOpen((o) => !o)}
                className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {viewYear}
                <ChevronDown className={cn("h-3 w-3 transition-transform", yearOpen && "rotate-180")} />
              </button>
              {yearOpen && (
                <div
                  ref={yearListRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-20 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md z-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {Array.from({ length: maxYear - 1950 + 1 }, (_, i) => maxYear - i).map((year) => (
                    <button
                      key={year}
                      type="button"
                      data-active={year === viewYear}
                      onClick={() => { setViewYear(year); setYearOpen(false); }}
                      className={cn(
                        "w-full px-2 py-1.5 text-xs text-center transition-colors",
                        year === viewYear
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-gray-700 hover:bg-gray-100",
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS.map((m, i) => {
              const isSelected = selectedYear === viewYear && selectedMonth === i;
              return (
                <button
                  key={m}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "h-8 rounded-md text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {safeValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="w-full mt-2 text-xs text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
