import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DoctorSettings() {
  return (
    <DashboardLayout role="doctor" userName="Dr. Maria Santos">
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Patient Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about high-risk patient updates
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders before appointments
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Follow-up Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about overdue follow-ups
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email summaries
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Display</CardTitle>
            <CardDescription>Customize your display settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Language</Label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred language
                </p>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fil">Filipino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default View</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your landing page
                </p>
              </div>
              <Select defaultValue="dashboard">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="queue">Patient Queue</SelectItem>
                  <SelectItem value="appointments">Appointments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>Set your availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Working Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Set your consultation hours
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue="8am">
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7am">7:00 AM</SelectItem>
                    <SelectItem value="8am">8:00 AM</SelectItem>
                    <SelectItem value="9am">9:00 AM</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">to</span>
                <Select defaultValue="5pm">
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4pm">4:00 PM</SelectItem>
                    <SelectItem value="5pm">5:00 PM</SelectItem>
                    <SelectItem value="6pm">6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Duration</Label>
                <p className="text-sm text-muted-foreground">
                  Default time per patient
                </p>
              </div>
              <Select defaultValue="30">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
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
          <Button>Save All Settings</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
