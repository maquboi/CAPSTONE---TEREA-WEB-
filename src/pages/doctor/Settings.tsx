import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function DoctorSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    patientAlerts: true, appointmentReminders: true, followUpAlerts: true, emailNotifs: false,
    language: "en", defaultView: "dashboard",
    startHour: "8am", endHour: "5pm", duration: "30",
  });

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value });

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  };

  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="account-page mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1 className="dashboard-title text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="dashboard-muted">Manage your preferences</p>
        </div>

        <div className="space-y-6">
          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">Notifications</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label>Patient Alerts</Label><p className="text-sm text-[#2D3B1E]/65">Get notified about high-risk patient updates</p></div>
                <Switch checked={settings.patientAlerts} onCheckedChange={(v) => update("patientAlerts", v)} />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label>Appointment Reminders</Label><p className="text-sm text-[#2D3B1E]/65">Receive reminders before appointments</p></div>
                <Switch checked={settings.appointmentReminders} onCheckedChange={(v) => update("appointmentReminders", v)} />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label>Follow-up Alerts</Label><p className="text-sm text-[#2D3B1E]/65">Get notified about overdue follow-ups</p></div>
                <Switch checked={settings.followUpAlerts} onCheckedChange={(v) => update("followUpAlerts", v)} />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5"><Label>Email Notifications</Label><p className="text-sm text-[#2D3B1E]/65">Receive email summaries</p></div>
                <Switch checked={settings.emailNotifs} onCheckedChange={(v) => update("emailNotifs", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">Display</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">Customize your display settings</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-0.5"><Label>Language</Label><p className="text-sm text-[#2D3B1E]/65">Select your preferred language</p></div>
                <Select value={settings.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fil">Filipino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="space-y-0.5"><Label>Default View</Label><p className="text-sm text-[#2D3B1E]/65">Choose your landing page</p></div>
                <Select value={settings.defaultView} onValueChange={(v) => update("defaultView", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="queue">Patient Queue</SelectItem>
                    <SelectItem value="appointments">Appointments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">Schedule</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">Set your availability</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3 lg:col-span-2">
                <div className="space-y-0.5"><Label>Working Hours</Label><p className="text-sm text-[#2D3B1E]/65">Set your consultation hours</p></div>
                <div className="flex items-center gap-2">
                  <Select value={settings.startHour} onValueChange={(v) => update("startHour", v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7am">7:00 AM</SelectItem>
                      <SelectItem value="8am">8:00 AM</SelectItem>
                      <SelectItem value="9am">9:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[#2D3B1E]/65">to</span>
                  <Select value={settings.endHour} onValueChange={(v) => update("endHour", v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4pm">4:00 PM</SelectItem>
                      <SelectItem value="5pm">5:00 PM</SelectItem>
                      <SelectItem value="6pm">6:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3 lg:col-span-2">
                <div className="space-y-0.5"><Label>Appointment Duration</Label><p className="text-sm text-[#2D3B1E]/65">Default time per patient</p></div>
                <Select value={settings.duration} onValueChange={(v) => update("duration", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Save All Settings</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
