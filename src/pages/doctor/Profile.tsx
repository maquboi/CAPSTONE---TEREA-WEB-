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
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone Number",
    address: "Address",
    addressPlaceholder: "Enter clinic or home address",
    specialty: "Specialty",
    license: "License Number",
    saveChanges: "Save Changes",
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
    firstName: "Pangalan",
    lastName: "Apelyido",
    email: "Email",
    phone: "Numero ng Telepono",
    address: "Address",
    addressPlaceholder: "Ipasok ang address ng klinika o bahay",
    specialty: "Espesyalisasyon",
    license: "Numero ng Lisensya",
    saveChanges: "I-save ang mga Pagbabago",
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

  const [doctorName, setDoctorName] = useState("Doctor");
  const [profile, setProfile] = useState({
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@terea.ph",
    phone: "+63 917 123 4567",
    address: "", 
    specialty: "Pulmonology",
    license: "PRC-0123456",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profileData) setDoctorName(profileData.full_name);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = () => {
    triggerAlert(t("profileUpdated"), t("profileSaved"), "success");
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogPortal>
          <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
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
                    <AvatarFallback className="bg-[#606C38] text-xl text-white">MS</AvatarFallback>
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
                  <p className="font-semibold text-[#2D3B1E]">{profile.firstName} {profile.lastName}</p>
                  <p className="text-sm text-[#2D3B1E]/65">{profile.email}</p>
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
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("firstName")}</Label>
                  <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("lastName")}</Label>
                  <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("address")}</Label>
                <Input id="address" placeholder={t("addressPlaceholder")} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="specialty">{t("specialty")}</Label>
                  <Input id="specialty" value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">{t("license")}</Label>
                  <Input id="license" value={profile.license} onChange={(e) => setProfile({ ...profile, license: e.target.value })} />
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={handleSave} className="w-full sm:w-auto">{t("saveChanges")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}