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

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailNotifs: true, systemAlerts: true, weeklyReports: false,
    language: "en", timezone: "asia-manila",
    autoBackup: true, dataRetention: "1year",
  });

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value });

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="account-page mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1 className="dashboard-title text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="dashboard-muted">Manage system preferences</p>
        </div>

        <div className="space-y-6">
          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">Notifications</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-[#2D3B1E]/65">Receive email alerts for critical events</p>
                </div>
                <Switch checked={settings.emailNotifs} onCheckedChange={(v) => update("emailNotifs", v)} />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-sm text-[#2D3B1E]/65">Get notified about system errors</p>
                </div>
                <Switch checked={settings.systemAlerts} onCheckedChange={(v) => update("systemAlerts", v)} />
              </div>
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-[#2D3B1E]/65">Receive weekly summary reports</p>
                </div>
                <Switch checked={settings.weeklyReports} onCheckedChange={(v) => update("weeklyReports", v)} />
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
                <div className="space-y-0.5">
                  <Label>Language</Label>
                  <p className="text-sm text-[#2D3B1E]/65">Select your preferred language</p>
                </div>
                <Select value={settings.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fil">Filipino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label>Timezone</Label>
                  <p className="text-sm text-[#2D3B1E]/65">Set your local timezone</p>
                </div>
                <Select value={settings.timezone} onValueChange={(v) => update("timezone", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-manila">Asia/Manila</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">Data & Privacy</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">Manage data settings</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-2">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label>Auto-backup</Label>
                  <p className="text-sm text-[#2D3B1E]/65">Automatically backup data daily</p>
                </div>
                <Switch checked={settings.autoBackup} onCheckedChange={(v) => update("autoBackup", v)} />
              </div>
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label>Data Retention</Label>
                  <p className="text-sm text-[#2D3B1E]/65">How long to keep inactive records</p>
                </div>
                <Select value={settings.dataRetention} onValueChange={(v) => update("dataRetention", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
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
