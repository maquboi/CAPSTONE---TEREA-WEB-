import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Camera, CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    profileUpdated: "Profile updated",
    profileSaved: "Your profile information has been saved successfully.",
    pageTitle: "Profile",
    pageSubtitle: "Manage your account information",
    profilePicTitle: "Profile Picture",
    profilePicDesc: "Update your profile photo",
    uploadTitle: "Upload",
    uploadDesc: "Photo upload requires cloud storage.",
    personalInfoTitle: "Personal Information",
    personalInfoDesc: "Update your personal details",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    clinicName: "Clinic / Workplace Name",
    license: "License Number",
    saveChanges: "Save Changes",
    saving: "Saving...",
    errorTitle: "Error",
    errorDesc: "Failed to update profile. Please try again.",
    okBtn: "Okay"
  },
  fil: {
    profileUpdated: "Na-update ang profile",
    profileSaved: "Matagumpay na na-save ang impormasyon ng iyong profile.",
    pageTitle: "Profile",
    pageSubtitle: "Pamahalaan ang impormasyon ng iyong account",
    profilePicTitle: "Larawan ng Profile",
    profilePicDesc: "I-update ang iyong larawan sa profile",
    uploadTitle: "I-upload",
    uploadDesc: "Kinakailangan ang cloud storage para sa pag-upload ng larawan.",
    personalInfoTitle: "Personal na Impormasyon",
    personalInfoDesc: "I-update ang iyong mga personal na detalye",
    fullName: "Buong Pangalan",
    email: "Email Address",
    phone: "Numero ng Telepono",
    clinicName: "Pangalan ng Klinika / Pinagtatrabahuan",
    license: "Numero ng Lisensya",
    saveChanges: "I-save ang mga Pagbabago",
    saving: "Nagse-save...",
    errorTitle: "Error",
    errorDesc: "Nabigo ang pag-update. Subukan muli.",
    okBtn: "Okay"
  }
};

export default function DoctorProfile() {
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  // Centralized Alert State
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [doctorName, setDoctorName] = useState("Maq Salazar");
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "Maq Salazar",
    email: "",
    phone: "",
    clinicName: "", 
    license: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, contact_number, license_number, clinic_name')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setProfile({
            fullName: profileData.full_name || "Maq Salazar",
            email: profileData.email || "",
            phone: profileData.contact_number || "",
            clinicName: profileData.clinic_name || "",
            license: profileData.license_number || "",
          });
          setDoctorName(profileData.full_name || "Maq Salazar");
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Update Profile Information in Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: profile.fullName,
            email: profile.email, 
            contact_number: profile.phone,
            license_number: profile.license,
            clinic_name: profile.clinicName
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // 2. Log Activity to Supabase
        await supabase.from('activity_logs').insert([{
          doctor_id: user.id,
          action: 'Profile Update',
          patient: 'N/A',
          details: 'Updated personal profile information and credentials.'
        }]);
      }

      // 3. Update UI State
      setDoctorName(profile.fullName || "Maq Salazar");
      
      triggerAlert(t("profileUpdated"), t("profileSaved"), "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      triggerAlert(t("errorTitle"), t("errorDesc"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get initials for the avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "MS";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-[#DDE5B6]' : 'bg-red-100'}`}>
              {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-[#606C38]" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{alert.title}</h2>
            <p className="text-slate-500 mt-2 text-sm">{alert.message}</p>
            <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>{t("okBtn")}</Button>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div className="account-page mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="dashboard-title text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
          <p className="dashboard-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="dashboard-surface rounded-2xl h-fit">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">{t("profilePicTitle")}</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">{t("profilePicDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-[#DDE5B6]/60 ring-offset-2 ring-offset-[#F4F7F4]">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-[#606C38] text-xl text-white">
                      {getInitials(profile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    onClick={() => triggerAlert(t("uploadTitle"), t("uploadDesc"), "success")}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <p className="font-semibold text-[#2D3B1E]">{profile.fullName}</p>
                  <p className="text-sm text-[#2D3B1E]/65">{profile.email || "No email set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-surface rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base text-[#2D3B1E]">{t("personalInfoTitle")}</CardTitle>
              <CardDescription className="text-[#2D3B1E]/65">{t("personalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">{t("fullName")}</Label>
                  <Input 
                    id="fullName" 
                    value={profile.fullName} 
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} 
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email} 
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone} 
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">{t("license")}</Label>
                  <Input 
                    id="license" 
                    value={profile.license} 
                    onChange={(e) => setProfile({ ...profile, license: e.target.value })} 
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">{t("clinicName")}</Label>
                  <Input 
                    id="clinicName" 
                    value={profile.clinicName} 
                    onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })} 
                    placeholder="e.g. Carmona Health Center"
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38]" 
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-[#606C38] hover:bg-[#2D3B1E] text-white rounded-xl h-11 px-8 font-semibold transition-all disabled:opacity-70"
                >
                  {isSaving ? t("saving") : t("saveChanges")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}