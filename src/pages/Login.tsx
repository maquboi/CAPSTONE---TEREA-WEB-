import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, ShieldCheck, Stethoscope, CheckCircle2, X, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [isSuccess, setIsSuccess] = useState(false);

  // Support Modal States
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportType, setSupportType] = useState<string>("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportStatus, setSupportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [supportError, setSupportError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !role) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Invalid email or password");
      }

      if (!authData.user) throw new Error("User not found");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found. Contact IT support.");
      }

      if (profile.role !== role) {
        throw new Error(`This account is not registered as a ${role}.`);
      }

      setIsSuccess(true);
      
      setTimeout(() => {
        if (profile.role === "admin") {
          navigate("/admin/dashboard");
        } else if (profile.role === "doctor") {
          navigate("/doctor/dashboard");
        } else {
          setError("Unauthorized access.");
          setIsSuccess(false);
        }
      }, 5000);

    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      await supabase.auth.signOut();
      setIsLoading(false); 
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportStatus("loading");
    setSupportError("");

    if (!supportEmail || !supportType || !supportMessage) {
      setSupportError("Please fill in all fields.");
      setSupportStatus("error");
      return;
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{ 
          email: supportEmail, 
          issue_type: supportType, 
          message: supportMessage 
        }]);

      if (error) throw error;

      setSupportStatus("success");
      setTimeout(() => {
        setIsSupportModalOpen(false);
        setSupportStatus("idle");
        setSupportEmail("");
        setSupportMessage("");
        setSupportType("");
      }, 4000);
    } catch (err: any) {
      setSupportError(err.message || "Failed to send request.");
      setSupportStatus("error");
    }
  };

  const openSupportModal = (defaultType: string) => {
    setSupportType(defaultType);
    setIsSupportModalOpen(true);
    setSupportStatus("idle");
  };

  return (
    <div className="auth-shell relative flex min-h-screen overflow-hidden bg-[#F4F7F4]">
      <div className="auth-ambient auth-blob-one" aria-hidden="true" />
      <div className="auth-ambient auth-blob-two" aria-hidden="true" />

      <div
        className="relative hidden lg:flex lg:w-[52%] bg-cover bg-center"
        style={{
          backgroundImage: "url('/CarmonaHealthBarangay.jpg')",
          backgroundColor: "#DDE5B6"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D3B1E]/90 via-[#2D3B1E]/74 to-[#606C38]/70" />

        <div className="relative z-10 flex w-full flex-col justify-between p-11 xl:p-14">
          <div className="space-y-8">
            <div className="flex flex-col items-start">
              <img src="/LogoNoBG.png" alt="TEREA Logo" className="h-12 w-12 mb-3 object-contain drop-shadow-md" />
              <h1 className="text-2xl font-bold tracking-tight text-white">TEREA</h1>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#DDE5B6]">TB RISK ASSESSMENT PLATFORM</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white xl:text-5xl">
                Secure clinical access for faster TB response.
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-white/85">
                Unified sign-in for care teams managing assessments, follow-ups, and patient risk alerts in Carmona.
              </p>
            </div>

            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="auth-info-card">
                <ShieldCheck className="h-5 w-5 text-[#DDE5B6]" />
                <span>Clinical Workflow</span>
              </div>
              <div className="auth-info-card">
                <Stethoscope className="h-5 w-5 text-[#DDE5B6]" />
                <span>Doctor workflow</span>
              </div>
              <div className="auth-info-card sm:col-span-2">
                <Building2 className="h-5 w-5 text-[#DDE5B6]" />
                <span>Municipality of Carmona</span>
              </div>
            </div>
          </div>

          <p className="border-t border-white/15 pt-5 text-xs tracking-wide text-white/70">
            © 2026 TEREA. Municipality of Carmona Health Office.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-5 sm:p-9 lg:p-12">
        <div className="auth-form-card w-full max-w-[500px] space-y-7 rounded-[2rem] p-6 sm:p-8 md:p-10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-lg border border-[#606C38]/30 bg-[#DDE5B6]/35 px-3 py-1.5 text-sm font-semibold text-[#2D3B1E] transition-all hover:border-[#606C38] hover:bg-[#DDE5B6]/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <div className="lg:hidden flex flex-col items-center text-center">
            <img src="/LogoNoBG.png" alt="TEREA Logo" className="h-12 w-12 mb-2 object-contain drop-shadow-sm" />
            <h1 className="text-2xl font-bold tracking-tight text-[#2D3B1E]">TEREA</h1>
            <p className="text-xs font-semibold tracking-wider text-[#606C38]">RISK ASSESSMENT</p>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-[#2D3B1E]">Welcome back</h2>
            <p className="text-sm font-medium text-slate-500">Sign in to continue to your staff portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                <div className="mr-3 shrink-0 rounded-full bg-red-100 p-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">Sign in as</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="h-12 rounded-xl border-[#606C38]/20 bg-[#F4F7F4] text-slate-700 transition-all focus:border-[#606C38] focus:ring-[#606C38]">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="admin" className="cursor-pointer">Administrator</SelectItem>
                  <SelectItem value="doctor" className="cursor-pointer">Doctor / Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@carmona.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-[#606C38]/20 bg-[#F4F7F4] text-slate-700 placeholder:text-slate-400 transition-all focus-visible:border-[#606C38] focus-visible:ring-[#606C38]"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">Password</Label>
                <button
                  type="button"
                  onClick={() => openSupportModal("Password Reset Request")}
                  className="text-xs font-semibold text-[#606C38] transition-colors hover:text-[#2D3B1E]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-[#606C38]/20 bg-[#F4F7F4] pr-10 text-slate-700 placeholder:text-slate-400 transition-all focus-visible:border-[#606C38] focus-visible:ring-[#606C38]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#606C38]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="btn-premium mt-6 h-12 w-full rounded-xl bg-[#606C38] text-sm font-bold text-white shadow-sm hover:bg-[#4A5529]"
              disabled={isLoading || isSuccess}
            >
              {isLoading && !isSuccess ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : isSuccess ? (
                "Success!"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="border-t border-[#606C38]/15 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Need access?{" "}
              <button 
                type="button"
                onClick={() => openSupportModal("General IT Support")}
                className="font-semibold text-[#606C38] transition-colors hover:text-[#2D3B1E]"
              >
                Contact IT Support
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Centered Success Overlay Notification */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-sm transition-all duration-500 ease-out ${
          isSuccess ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div 
          className={`flex flex-col items-center gap-4 rounded-3xl border border-[#606C38]/10 bg-white p-10 text-center shadow-[0_20px_60px_rgba(45,59,30,0.15)] transition-all duration-700 ease-out ${
            isSuccess ? "scale-100 translate-y-0" : "scale-90 translate-y-8"
          }`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#DDE5B6]/40">
            <CheckCircle2 className="h-10 w-10 text-[#606C38]" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#2D3B1E]">Login Successful</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Securely redirecting to your portal...
            </p>
          </div>
          
          <div className="mt-4 flex gap-1.5">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#606C38]" style={{ animationDelay: "0ms" }}></span>
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#606C38]" style={{ animationDelay: "150ms" }}></span>
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#606C38]" style={{ animationDelay: "300ms" }}></span>
          </div>
        </div>
      </div>

      {/* IT Support / Password Reset Modal */}
      <div 
        className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all duration-300 ${
          isSupportModalOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div 
          className={`w-full max-w-md bg-white rounded-3xl shadow-xl transition-all duration-500 ease-out ${
            isSupportModalOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDE5B6]/30">
                <Headset className="h-5 w-5 text-[#606C38]" />
              </div>
              <h3 className="text-lg font-bold text-[#2D3B1E]">IT Support Desk</h3>
            </div>
            <button 
              onClick={() => setIsSupportModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {supportStatus === "success" ? (
              <div className="py-8 text-center space-y-4 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#2D3B1E]">Ticket Submitted</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Your request has been sent to the system administrator. Please wait for an email with further instructions.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-5">
                {supportError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                    {supportError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">Issue Type</Label>
                  <Select value={supportType} onValueChange={setSupportType}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="Password Reset Request">Password Reset Request</SelectItem>
                      <SelectItem value="Account Locked">Account Locked</SelectItem>
                      <SelectItem value="System Bug">System Bug / Glitch</SelectItem>
                      <SelectItem value="General IT Support">General IT Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">Your Email</Label>
                  <Input
                    type="email"
                    placeholder="name@carmona.gov.ph"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:border-[#606C38] focus-visible:ring-[#606C38]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">Message / Details</Label>
                  <textarea
                    placeholder="Please describe the issue..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#606C38] focus:border-transparent transition-all resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={supportStatus === "loading"}
                  className="w-full h-11 rounded-xl bg-[#606C38] hover:bg-[#4A5529] font-bold text-white transition-colors"
                >
                  {supportStatus === "loading" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : "Send Support Request"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}