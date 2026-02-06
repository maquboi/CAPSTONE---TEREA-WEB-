import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react";

const appointments = [
  {
    id: 1,
    patientName: "Juan Dela Cruz",
    time: "09:00 AM",
    type: "Check-up",
    status: "Confirmed",
  },
  {
    id: 2,
    patientName: "Maria Garcia",
    time: "10:30 AM",
    type: "Follow-up",
    status: "Confirmed",
  },
  {
    id: 3,
    patientName: "Pedro Santos",
    time: "02:00 PM",
    type: "Lab Review",
    status: "Pending",
  },
  {
    id: 4,
    patientName: "Ana Reyes",
    time: "03:30 PM",
    type: "Consultation",
    status: "Confirmed",
  },
];

const upcomingDays = [
  { date: "Feb 6", day: "Thu", appointments: 4, isToday: true },
  { date: "Feb 7", day: "Fri", appointments: 3, isToday: false },
  { date: "Feb 8", day: "Sat", appointments: 0, isToday: false },
  { date: "Feb 9", day: "Sun", appointments: 0, isToday: false },
  { date: "Feb 10", day: "Mon", appointments: 5, isToday: false },
];

export default function Appointments() {
  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Appointments
            </h1>
            <p className="text-muted-foreground">
              Manage your appointment schedule
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>

        {/* Week view */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">This Week</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">February 2026</span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {upcomingDays.map((day) => (
                <button
                  key={day.date}
                  className={`flex flex-col items-center rounded-lg border p-3 transition-colors hover:bg-accent ${
                    day.isToday ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                  <span className={`text-lg font-semibold ${day.isToday ? "text-primary" : ""}`}>
                    {day.date.split(" ")[1]}
                  </span>
                  {day.appointments > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {day.appointments}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Today's Schedule</CardTitle>
              </div>
              <Badge>{appointments.length} appointments</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{apt.time}</span>
                    </div>
                    <div>
                      <p className="font-medium">{apt.patientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={apt.status === "Confirmed" ? "default" : "secondary"}
                      className={apt.status === "Confirmed" ? "bg-status-success" : ""}
                    >
                      {apt.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
