import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Camera, CheckCircle2, AlertCircle, Copy, Check, Clock, 
  ShieldCheck, Building2, Mail, Phone, FileText, Loader2, User
} from "lucide-react";
import { useLanguage } from "../admin/LanguageContext";

const translations: Record<string, Record<string, string>> = {
  en: {
    profileUpdated: "Profile Updated",
    profileSaved: "Your physician profile and clinical duty schedule have been saved successfully.",
    pageTitle: "Physician Credentials & Profile",
    pageSubtitle: "Manage your medical licensing, facility affiliation, and consultation duty hours",
    profilePicTitle: "Official Identification Photo",
    profilePicDesc: "Upload an official clinical portrait or headshot",
    personalInfoTitle: "Physician Credentials & Personal Details",
    personalInfoDesc: "Update your official DOH / PRC licensing details and health center facility assignment",
    fullName: "Full Legal Name (with Title)",
    email: "Official Email Address",
    phone: "Direct Contact Number",
    clinicName: "Assigned Health Facility / Clinic",
    license: "PRC Medical License Number",
    clinicCode: "Unique Clinic Linking Code",
    consultationHours: "Consultation & Duty Hours",
    startHour: "Duty Start Time",
    endHour: "Duty End Time",
    saveChanges: "Save Profile Changes",
    saving: "Saving Updates...",
    errorTitle: "Error",
    errorDesc: "Failed to update profile. Please verify your connection and try again.",
    okBtn: "Acknowledge",
    copied: "Copied!",
    copyCode: "Copy Code",
    imageUploaded: "Photo Updated",
    imageUploadedDesc: "Your clinical profile photo was updated successfully.",
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
    okBtn: "Sige",
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

    if (file.size > 5 * 1024 * 1024) {
      triggerAlert(t("errorTitle"), "Photo file size must be under 5MB.", "error");
      return;
    }

    setIsUploadingPhoto(true);

    try {
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
      if (!user) throw new Error("No active user session");

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
        details: `Updated personal credentials and schedule (${profile.startHour} – ${profile.endHour}).`
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
      .replace(/^(dr\.?\s*)+/i, "")
      .split(/\s+/)
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const cleanDisplayDoctorName = (name: string) => {
    if (!name) return "Doctor";
    return `Dr. ${name.replace(/^(dr\.?\s*)+/i, "").trim()}`;
  };

  return (
    <DashboardLayout role="doctor" userName={doctorName}>
      
      {/* Centralized Notification Modal */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({ ...alert, open })}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-teal-50 border border-teal-200' : 'bg-red-50 border border-red-200'}`}>
            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-teal-700" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 text-center">{alert.title}</DialogTitle>
            <DialogDescription className="text-slate-500 mt-1.5 text-xs text-center leading-relaxed">
              {alert.message}
            </DialogDescription>
          </DialogHeader>
          <Button 
            className="mt-6 w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-10 shadow-xs" 
            onClick={() => setAlert({ ...alert, open: false })}
          >
            {t("okBtn")}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-6xl space-y-6 animate-fade-in font-sans">
        
        {/* --- PAGE HEADER BANNER --- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-300/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              Verified Clinical Identity
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 pt-1">{t("pageTitle")}</h1>
            <p className="text-slate-500 text-xs font-normal">{t("pageSubtitle")}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl h-10 px-5 font-bold text-xs shadow-xs transition-all disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
              {isSaving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          
          {/* --- LEFT COLUMN: PHYSICIAN CREDENTIALS & LINKING CARD --- */}
          <div className="space-y-6">
            
            {/* Physician Identification Card */}
            <Card className="rounded-2xl border border-slate-300/80 bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("profilePicTitle")}</CardTitle>
                <CardDescription className="text-[11px] text-slate-500">{t("profilePicDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  className="hidden" 
                />

                <div className="relative mb-4">
                  <Avatar className="h-28 w-28 rounded-2xl border-2 border-teal-200 shadow-sm">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-teal-50 text-teal-800 text-2xl font-black rounded-2xl border border-teal-200">
                      {getInitials(profile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-white shadow-md hover:bg-slate-100 border border-slate-300 text-teal-700"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload official clinical portrait"
                  >
                    {isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 leading-snug">{cleanDisplayDoctorName(profile.fullName)}</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{profile.email || "No email registered"}</p>
                
                {profile.license && (
                  <p className="text-[11px] font-mono font-bold text-teal-800 mt-1">
                    PRC Lic. #{profile.license}
                  </p>
                )}

                <div className="flex items-center gap-1.5 mt-3.5 px-3 py-1 bg-teal-50 rounded-full border border-teal-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                  <span className="text-[11px] font-bold text-teal-800">Verified DOH DOTS Physician</span>
                </div>
              </CardContent>
            </Card>

            {/* Institutional Clinic Linking Code Box */}
            <Card className="rounded-2xl border border-teal-200 bg-teal-50/40 shadow-xs p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">{t("clinicCode")}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={copyClinicCode}
                  className="h-7 text-xs font-bold text-teal-800 bg-white border-teal-200 hover:bg-teal-50 rounded-lg shadow-2xs"
                >
                  {copiedCode ? <Check className="h-3 w-3 mr-1 text-teal-700" /> : <Copy className="h-3 w-3 mr-1 text-teal-700" />}
                  {copiedCode ? t("copied") : t("copyCode")}
                </Button>
              </div>
              <p className="text-2xl font-mono font-extrabold tracking-widest text-slate-900 pt-1">
                {profile.clinicCode || "TEREA-DOC"}
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                Patients enter this linking key in their TEREA mobile companion app to sync their daily adherence logs directly with your clinical workstation.
              </p>
            </Card>
          </div>

          {/* --- RIGHT COLUMN: DETAILED CREDENTIAL FORM --- */}
          <Card className="rounded-2xl border border-slate-300/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/70">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-700" />
                {t("personalInfoTitle")}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">{t("personalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              <div className="grid gap-4 sm:grid-cols-2">
                
                {/* Full Legal Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="fullName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("fullName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="fullName" 
                      value={profile.fullName} 
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} 
                      className="rounded-xl border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 pl-10" 
                    />
                  </div>
                </div>

                {/* PRC License */}
                <div className="space-y-1.5">
                  <Label htmlFor="license" className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("license")}</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="license" 
                      placeholder="e.g. 0123456"
                      value={profile.license} 
                      onChange={(e) => setProfile({ ...profile, license: e.target.value })} 
                      className="rounded-xl border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 pl-10" 
                    />
                  </div>
                </div>

                {/* Direct Contact */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("phone")}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="phone" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                      placeholder="e.g. 09171234567"
                      className="rounded-xl border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 pl-10" 
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                      className="rounded-xl border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 pl-10" 
                    />
                  </div>
                </div>

                {/* Assigned Health Center Facility */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="clinicName" className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("clinicName")}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      id="clinicName" 
                      value={profile.clinicName} 
                      onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })} 
                      placeholder="e.g. Carmona Health Center - TB DOTS Clinic"
                      className="rounded-xl border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700 h-10 pl-10" 
                    />
                  </div>
                </div>
              </div>

              {/* Consultation & Duty Hours Section */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t("consultationHours")}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500">{t("startHour")}</Label>
                    <Input 
                      value={profile.startHour}
                      onChange={(e) => setProfile({ ...profile, startHour: e.target.value })}
                      placeholder="e.g. 8:00 AM"
                      className="rounded-xl h-10 border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500">{t("endHour")}</Label>
                    <Input 
                      value={profile.endHour}
                      onChange={(e) => setProfile({ ...profile, endHour: e.target.value })}
                      placeholder="e.g. 5:00 PM"
                      className="rounded-xl h-10 border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus-visible:border-teal-700 focus-visible:ring-teal-700"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl h-10 px-7 font-bold text-xs shadow-xs transition-all disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
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