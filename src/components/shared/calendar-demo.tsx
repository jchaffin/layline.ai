"use client"

import { useState } from "react"
import { DatePicker, DateRangePicker } from "@/components/shared/date-picker"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock } from "lucide-react"

export function CalendarDemo() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedRange, setSelectedRange] = useState<{from?: Date, to?: Date}>({})
  const [calendarDate, setCalendarDate] = useState<Date>()

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Calendar Components</h2>
        <p className="text-lg text-gray-600">
          Interactive date selection components for interview scheduling and tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Date Picker Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Single Date Picker
            </CardTitle>
            <CardDescription>
              Select a single date for interview scheduling or deadline tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Interview Date</label>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                placeholder="Select interview date"
              />
            </div>
            
            {selectedDate && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Selected Date</span>
                </div>
                <p className="text-blue-700">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Range Picker Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-green-600" />
              Date Range Picker
            </CardTitle>
            <CardDescription>
              Select a date range for job application periods or preparation timeframes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Preparation Period</label>
              <DateRangePicker
                from={selectedRange.from}
                to={selectedRange.to}
                onDateRangeChange={setSelectedRange}
                placeholder="Select preparation timeframe"
              />
            </div>
            
            {selectedRange.from && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">Selected Range</span>
                </div>
                <div className="space-y-1">
                  <p className="text-green-700">
                    <strong>From:</strong> {selectedRange.from.toLocaleDateString()}
                  </p>
                  {selectedRange.to && (
                    <p className="text-green-700">
                      <strong>To:</strong> {selectedRange.to.toLocaleDateString()}
                    </p>
                  )}
                  {selectedRange.from && selectedRange.to && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 mt-2">
                      {Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Calendar Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-600" />
            Full Calendar View
          </CardTitle>
          <CardDescription>
            Interactive calendar for comprehensive date selection and navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={setCalendarDate}
              className="rounded-md border"
            />
          </div>
          
          {calendarDate && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900">Calendar Selection</span>
              </div>
              <p className="text-purple-700">
                Selected: {calendarDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Use Cases Card */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Use Cases</CardTitle>
          <CardDescription>
            How these calendar components enhance your interview preparation workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📅 Interview Scheduling</h4>
              <p className="text-sm text-blue-700">
                Schedule and track upcoming interview dates with visual calendar selection
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">⏰ Preparation Planning</h4>
              <p className="text-sm text-green-700">
                Set preparation timeframes and track progress over date ranges
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Application Tracking</h4>
              <p className="text-sm text-purple-700">
                Monitor application deadlines and follow-up dates with clear visual indicators
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">Goal Setting</h4>
              <p className="text-sm text-orange-700">
                Set target dates for job search milestones and career objectives
              </p>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-2">📈 Progress Tracking</h4>
              <p className="text-sm text-indigo-700">
                Visualize interview preparation progress over time with date-based insights
              </p>
            </div>
            
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
              <h4 className="font-semibold text-pink-900 mb-2">🔄 Follow-up Management</h4>
              <p className="text-sm text-pink-700">
                Schedule and manage follow-up communications with recruiters and hiring managers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}