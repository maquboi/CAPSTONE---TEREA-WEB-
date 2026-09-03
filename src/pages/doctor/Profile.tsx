import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, CheckCircle, AlertCircle, Copy, Check, Clock, ShieldCheck, Building2 } from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    profileUpdated: "Profile Updated",
    profileSaved: "Your profile information and clinic schedule have been saved successfully.",
    pageTitle: "Physician Profile",
    pageSubtitle: "Manage your credentials, clinic affiliation, and consultation hours",
    profilePicTitle: "Profile Photo",
    profilePicDesc: "Upload an official clinical photo",
    personalInfoTitle: "Physician Credentials & Personal Details",
    personalInfoDesc: "Update your official DOH licensing and facility information",
    fullName: "Full Name (with Title)",
    email: "Email Address",
    phone: "Contact Number",
    clinicName: "Assigned Health Facility / Clinic",
    license: "PRC License Number",
    clinicCode: "Unique Clinic Linking Code",
    consultationHours: "Consultation / Duty Hours",
    startHour: "Start Time",
    endHour: "End Time",
    saveChanges: "Save Profile Changes",
    saving: "Saving Updates...",
    errorTitle: "Error",
    errorDesc: "Failed to update profile. Please check your network and try again.",
    okBtn: "Okay",
    copied: "Copied!",
    copyCode: "Copy Code",
    imageUploaded: "Photo Updated",
    imageUploadedDesc: "Your profile photo was updated successfully.",
  },
  fil: {
    profileUpdated: "Na-update ang Profile",
    profileSaved: "Matagumpay na na-save ang impormasyon at iskedyul ng klinika.",
    pageTitle: "Profile ng Doktor",
    pageSubtitle: "Pamahalaan ang iyong lisensya, klinika, at oras ng konsultasyon",
    profilePicTitle: "Larawan ng Profile",
    profilePicDesc: "Mag-upload ng opisyal na larawan",
    personalInfoTitle: "Kredensyal at Personal na Impormasyon",
    personalInfoDesc: "I-update ang iyong lisensya sa PRC at pasilidad",
    fullName: "Buong Pangalan (kasama ang Titulo)",
    email: "Email Address",
    phone: "Numero ng Telepono",
    clinicName: "Pangalan ng Klinika / Health Center",
    license: "Numero ng Lisensya sa PRC",
    clinicCode: "Clinic Linking Code",
    consultationHours: "Oras ng Konsultasyon / Duty",
    startHour: "Oras ng Simula",
    endHour: "Oras ng Pagtatapos",
    saveChanges: "I-save ang mga Pagbabago",
    saving: "Nagse-save...",
    errorTitle: "Error",
    errorDesc: "Nabigong i-update ang profile. Pakisubukan muli.",
    okBtn: "Okay",
    copied: "Nakopya na!",
    copyCode: "Kopyahin ang Code",
    imageUploaded: "Na-update ang Larawan",
    imageUploadedDesc: "Matagumpay na na-update ang iyong larawan sa profile.",
  }
};

export default function DoctorProfile() {
  const { language } = useLanguage();
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [doctorName, setDoctorName] = useState("Doctor");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    clinicName: "Carmona Health Center - TB DOTS Clinic",
    license: "",
    clinicCode: "",
    startHour: "8:00 AM",
    endHour: "5:00 PM",
    avatarUrl: "",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, email, contact_number, license_number, clinic_name, clinic_code, start_hour, end_hour, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profileData) {
        setProfile({
          fullName: profileData.full_name || "Dr. Attending Physician",
          email: profileData.email || user.email || "",
          phone: profileData.contact_number || "",
          clinicName: profileData.clinic_name || "Carmona Health Center - TB DOTS Clinic",
          license: profileData.license_number || "",
          clinicCode: profileData.clinic_code || user.id.substring(0, 8).toUpperCase(),
          startHour: profileData.start_hour || "8:00 AM",
          endHour: profileData.end_hour || "5:00 PM",
          avatarUrl: profileData.avatar_url || "",
        });
        setDoctorName(profileData.full_name || "Doctor");
      }
    } catch (err: any) {
      console.error("Error fetching doctor profile:", err.message);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      triggerAlert(t("errorTitle"), "Photo must be less than 5MB.", "error");
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Client-side image compression to 256x256 WebP Data URL for instant rendering and persistence
      const compressedDataUrl = await compressImage(file, 256, 256);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session expired");

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: compressedDataUrl })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, avatarUrl: compressedDataUrl }));
      triggerAlert(t("imageUploaded"), t("imageUploadedDesc"), "success");
    } catch (err: any) {
      console.error("Upload error:", err.message);
      triggerAlert(t("errorTitle"), "Failed to process photo.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const compressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to compact WebP / JPEG format
        const dataUrl = canvas.toDataURL("image/webp", 0.85);
        resolve(dataUrl);
      };
      img.onerror = reject;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active user");

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.fullName,
          email: profile.email, 
          contact_number: profile.phone,
          license_number: profile.license,
          clinic_name: profile.clinicName,
          start_hour: profile.startHour,
          end_hour: profile.endHour,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await supabase.from('activity_logs').insert([{
        doctor_id: user.id,
        action: 'Profile Update',
        patient: 'N/A',
        details: `Updated personal credentials and schedule (${profile.startHour} - ${profile.endHour}).`
      }]);

      setDoctorName(profile.fullName);
      triggerAlert(t("profileUpdated"), t("profileSaved"), "success");
    } catch (error: any) {
      console.error("Error saving profile:", error.message);
      triggerAlert(t("errorTitle"), t("errorDesc"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const copyClinicCode = () => {
    if (!profile.clinicCode) return;
    navigator.clipboard.writeText(profile.clinicCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getInitials = (name: string) => {
    if (!name) return "DR";
    return name
      .replace(/^Dr\.?\s*/i, "")
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const cleanDisplayDoctorName = (name: string) => {
    if (!name) return "Doctor";
    return `Dr. ${name.replace(/^Dr\.?\s*/i, "")}`;
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      
      {/* Accessible Centered Dialog */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({ ...alert, open })}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-[#DDE5B6]' : 'bg-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-[#606C38]" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">{alert.title}</DialogTitle>
            <DialogDescription className="text-slate-600 mt-2 text-sm text-center">
              {alert.message}
            </DialogDescription>
          </DialogHeader>
          <Button 
            className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white font-bold" 
            onClick={() => setAlert({ ...alert, open: false })}
          >
            {t("okBtn")}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="account-page mx-auto max-w-6xl space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">{t("pageTitle")}</h1>
          <p className="text-sm text-slate-500">{t("pageSubtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          
          {/* Left Column: Avatar & Quick Info */}
          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-[#F4F7F4]/50">
                <CardTitle className="text-sm font-bold text-[#2D3B1E] uppercase tracking-wider">{t("profilePicTitle")}</CardTitle>
                <CardDescription className="text-xs text-slate-500">{t("profilePicDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                
                {/* Real File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />

                <div className="relative mb-4">
                  <Avatar className="h-24 w-24 ring-4 ring-[#DDE5B6] ring-offset-2 ring-offset-white shadow-sm">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-[#606C38] text-2xl font-black text-white">
                      {getInitials(profile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md hover:bg-slate-100 border border-slate-200"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload profile photo"
                  >
                    <Camera className="h-4 w-4 text-[#606C38]" />
                  </Button>
                </div>

                <h3 className="font-bold text-lg text-slate-900">{cleanDisplayDoctorName(profile.fullName)}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{profile.email || "No email registered"}</p>
                
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[11px] font-bold text-emerald-700">Verified DOH DOTS Physician</span>
                </div>
              </CardContent>
            </Card>

            {/* Clinic Code Sharing Box */}
            <Card className="rounded-2xl border border-[#DDE5B6] bg-[#FEFAE0]/30 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#606C38] uppercase tracking-wider">{t("clinicCode")}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={copyClinicCode}
                  className="h-7 text-xs font-bold text-[#606C38] hover:bg-[#FEFAE0]"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copiedCode ? t("copied") : t("copyCode")}
                </Button>
              </div>
              <p className="text-2xl font-mono font-black tracking-widest text-[#2D3B1E]">
                {profile.clinicCode || "TEREA-DOC"}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Patients can enter this code into their TEREA mobile app to instantly link their treatment diary with your clinic.
              </p>
            </Card>
          </div>

          {/* Right Column: Detailed Credential Form */}
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-[#2D3B1E]">{t("personalInfoTitle")}</CardTitle>
              <CardDescription className="text-xs text-slate-500">{t("personalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName" className="text-xs font-bold text-slate-600 uppercase">{t("fullName")}</Label>
                  <Input 
                    id="fullName" 
                    value={profile.fullName} 
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} 
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38] h-11" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license" className="text-xs font-bold text-slate-600 uppercase">{t("license")}</Label>
                  <Input 
                    id="license" 
                    placeholder="e.g. 0123456"
                    value={profile.license} 
                    onChange={(e) => setProfile({ ...profile, license: e.target.value })} 
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38] h-11 font-mono" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-600 uppercase">{t("phone")}</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone} 
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                    placeholder="e.g. 09171234567"
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38] h-11" 
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase">{t("email")}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email} 
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                    className="rounded-xl border-slate-200 focus-visible:ring-[#606C38] h-11" 
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="clinicName" className="text-xs font-bold text-slate-600 uppercase">{t("clinicName")}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="clinicName" 
                      value={profile.clinicName} 
                      onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })} 
                      placeholder="e.g. Carmona Health Center - TB DOTS Clinic"
                      className="rounded-xl border-slate-200 focus-visible:ring-[#606C38] h-11 pl-10 font-medium" 
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Duty Hours Section */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#606C38]" />
                  <span className="text-xs font-bold text-[#2D3B1E] uppercase tracking-wider">{t("consultationHours")}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">{t("startHour")}</Label>
                    <Input 
                      value={profile.startHour}
                      onChange={(e) => setProfile({ ...profile, startHour: e.target.value })}
                      placeholder="e.g. 8:00 AM"
                      className="rounded-xl h-10 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">{t("endHour")}</Label>
                    <Input 
                      value={profile.endHour}
                      onChange={(e) => setProfile({ ...profile, endHour: e.target.value })}
                      placeholder="e.g. 5:00 PM"
                      className="rounded-xl h-10 border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-[#606C38] hover:bg-[#2D3B1E] text-white rounded-xl h-11 px-8 font-bold shadow-sm transition-all disabled:opacity-70"
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