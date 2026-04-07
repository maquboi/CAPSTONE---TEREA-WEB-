import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminProfile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    firstName: "Admin", lastName: "User", email: "admin@terea.ph", phone: "+63 912 345 6789",
  });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const handleSaveProfile = () => {
    toast({ title: "Profile updated", description: "Your profile information has been saved." });
  };

  const handleUpdatePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "Your password has been changed successfully." });
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="account-page mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="dashboard-title text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="dashboard-muted">Manage your account information</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="dashboard-surface rounded-2xl h-fit">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">Profile Picture</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">Update your profile photo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-[#DDE5B6]/60 ring-offset-2 ring-offset-[#F4F7F4]">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-[#606C38] text-xl text-white">AU</AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" onClick={() => toast({ title: "Upload", description: "Photo upload requires cloud storage." })}>
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <p className="font-semibold text-[#2D3B1E]">{profile.firstName} {profile.lastName}</p>
                  <p className="text-sm text-[#2D3B1E]/65">{profile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="dashboard-surface rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base text-[#2D3B1E]">Personal Information</CardTitle>
                <CardDescription className="text-[#2D3B1E]/65">Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="pt-1">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-surface rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base text-[#2D3B1E]">Change Password</CardTitle>
                <CardDescription className="text-[#2D3B1E]/65">Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                </div>
                <Button onClick={handleUpdatePassword}>Update Password</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
