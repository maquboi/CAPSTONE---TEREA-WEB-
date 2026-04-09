import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ShieldCheck, 
  Smartphone, 
  History, 
  LogOut, 
  UserCircle, 
  Building2,
  Lock,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminProfile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Account Information
  const [profile, setProfile] = useState({
    firstName: "Admin", 
    lastName: "User", 
    email: "admin@terea.ph", 
    phone: "+63 912 345 6789",
  });
  
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  
  // Security Settings
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [lastLogin] = useState(new Date().toISOString());

  // Fixed Healthcare Assignment (Read-Only for Admin Security)
  const healthcareMeta = {
    facility: "Dasmariñas City Health Office",
    role: "System Administrator",
    licenseId: "TEREA-2026-ADM-01",
    status: "Active Authorized"
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    // Simulate API call to update profile
    setTimeout(() => {
      toast({ 
        title: "Profile Updated", 
        description: "Your administrative contact details have been saved." 
      });
      setLoading(false);
    }, 800);
  };

  const handleUpdatePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Error", description: "All password fields are required.", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    toast({ title: "Security Updated", description: "Your login credentials have been changed." });
    setPasswords({ current: "", new: "", confirm: "" });
  };

  return (
    <DashboardLayout role="admin" userName={`${profile.firstName} ${profile.lastName}`}>
      <div className="account-page mx-auto max-w-6xl space-y-6 pb-12 font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
            <p className="text-sm text-slate-500 font-medium">Manage administrative access and security protocols</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-[#606C38] rounded-xl border border-emerald-100">
             <CheckCircle2 className="h-3.5 w-3.5" />
             <span className="text-[11px] font-bold uppercase tracking-wider">{healthcareMeta.status}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          
          {/* Left Column: Fixed Identity & Quick Stats */}
          <div className="space-y-6">
            <Card className="bg-white rounded-2xl border-slate-200 shadow-sm overflow-hidden">
              <div className="h-20 bg-slate-50 w-full border-b border-slate-100 flex items-center justify-center">
                 <span className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase">Terea System Identity</span>
              </div>
              <CardContent className="pt-0 -mt-10 flex flex-col items-center">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg mb-4">
                  <AvatarImage src="/logo.png" /> {/* Link to your TEREA logo */}
                  <AvatarFallback className="bg-[#606C38] text-white font-bold text-xl">T</AvatarFallback>
                </Avatar>
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
                  <Badge variant="outline" className="text-[10px] font-bold text-[#606C38] border-[#606C38]/20 bg-[#606C38]/5">
                    {healthcareMeta.role}
                  </Badge>
                  <p className="text-xs text-slate-400 pt-2">{profile.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-widest">
                <History className="h-3.5 w-3.5 text-slate-400" /> Session History
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Last login</span>
                    <span className="font-semibold text-slate-800">{format(new Date(lastLogin), 'MMM dd, HH:mm')}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Device</span>
                    <span className="font-semibold text-slate-800">Admin Console (PC)</span>
                 </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-slate-200 h-9 text-red-600 hover:bg-red-50 hover:border-red-100">
                 <LogOut className="mr-2 h-3.5 w-3.5" /> Terminate other sessions
              </Button>
            </Card>
          </div>

          {/* Right Column: Information Forms */}
          <div className="space-y-6">
            
            {/* 1. Administrative Profile */}
            <Card className="bg-white rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-[#606C38]" /> Administrator Profile
                </CardTitle>
                <CardDescription>Update your contact information for system notifications</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-bold text-slate-500 uppercase tracking-tighter">First Name</Label>
                    <Input id="firstName" value={profile.firstName} className="rounded-xl border-slate-100 bg-slate-50/30" onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Last Name</Label>
                    <Input id="lastName" value={profile.lastName} className="rounded-xl border-slate-100 bg-slate-50/30" onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Official Email Address</Label>
                  <Input id="email" type="email" value={profile.email} className="rounded-xl border-slate-100 bg-slate-50/30" onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Mobile Number</Label>
                  <Input id="phone" value={profile.phone} className="rounded-xl border-slate-100 bg-slate-50/30" onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="pt-2">
                  <Button onClick={handleSaveProfile} disabled={loading} className="rounded-xl bg-[#606C38] hover:bg-[#4a542b] font-bold h-11 px-8 shadow-sm">
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Profile Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2. Facility Metadata (Fixed Cards) */}
            <Card className="bg-slate-50/50 rounded-2xl border-slate-200 shadow-sm border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-700">
                  <Building2 className="h-5 w-5 text-slate-400" /> Clinical Metadata
                </CardTitle>
                <CardDescription>Fixed system assignments for audit purposes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Registered Facility</p>
                    <p className="text-sm font-bold text-slate-800">{healthcareMeta.facility}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Administrative ID</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">{healthcareMeta.licenseId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Authentication & Security */}
            <Card className="bg-white rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-700">
                  <ShieldCheck className="h-5 w-5" /> Security Enforcement
                </CardTitle>
                <CardDescription>Multi-layer protection for administrative credentials</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                {/* 2FA Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><Smartphone className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
                      <p className="text-xs text-slate-500">Receive a secure code on your mobile device during login.</p>
                    </div>
                  </div>
                  <Switch checked={is2FAEnabled} onCheckedChange={(val) => {
                    setIs2FAEnabled(val);
                    toast({ title: val ? "2FA Activated" : "2FA Disabled" });
                  }} />
                </div>

                {/* Password Change */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-slate-400" />
                    <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Update Credentials</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">Current</Label>
                      <Input type="password" placeholder="••••••••" className="rounded-xl border-slate-200" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">New</Label>
                      <Input type="password" placeholder="New Password" className="rounded-xl border-slate-200" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">Confirm</Label>
                      <Input type="password" placeholder="Confirm New" className="rounded-xl border-slate-200" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={handleUpdatePassword} variant="outline" className="rounded-xl h-10 px-6 font-bold border-slate-200 text-slate-700">
                    Modify Security Key
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function cn(...classes: any[]) { return classes.filter(Boolean).join(' '); }