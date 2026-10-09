import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Stethoscope,
  CheckCircle2,
  X,
  Headset,
  Lock,
  AlertCircle,
} from "lucide-react";
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
  const [supportStatus, setSupportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [supportError, setSupportError] = useState("");

  // AUTO-REDIRECT: If session already exists, route user immediately by role
  useEffect(() => {
    const checkActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (profile?.role === "doctor") {
        navigate("/doctor/dashboard", { replace: true });
      }
    };

    checkActiveSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !role) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw new Error("Invalid email or password.");
      }

      if (!authData.user) throw new Error("User not found.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile record not found. Please contact IT support.");
      }

      // Gatekeeper: Patients must use the mobile app
      if (profile.role === "patient") {
        throw new Error(
          "Access Denied: Patients must access their care portal using the TEREA Mobile App."
        );
      }

      if (profile.role !== role) {
        throw new Error(
          `This account is registered with different permissions (not as a ${role}).`
        );
      }

      setIsSuccess(true);

      // 1-second transition to display the verified notification
      setTimeout(() => {
        if (profile.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (profile.role === "doctor") {
          navigate("/doctor/dashboard", { replace: true });
        } else {
          setError("Unauthorized access.");
          setIsSuccess(false);
        }
      }, 1000);
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
      setSupportError("Please fill in all required fields.");
      setSupportStatus("error");
      return;
    }

    try {
      const { error } = await supabase.from("support_tickets").insert([
        {
          email: supportEmail,
          issue_type: supportType,
          message: supportMessage,
        },
      ]);

      if (error) throw error;

      setSupportStatus("success");
      setTimeout(() => {
        setIsSupportModalOpen(false);
        setSupportStatus("idle");
        setSupportEmail("");
        setSupportMessage("");
        setSupportType("");
      }, 2500);
    } catch (err: any) {
      setSupportError(err.message || "Failed to submit request.");
      setSupportStatus("error");
    }
  };

  const openSupportModal = (defaultType: string) => {
    setSupportType(defaultType);
    setIsSupportModalOpen(true);
    setSupportStatus("idle");
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#F1F5F9] font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* LEFT COLUMN: Health Center Branding */}
      <div
        className="relative hidden lg:flex lg:w-[50%] bg-cover bg-center"
        style={{
          backgroundImage: "url('/CarmonaHealthBarangay.jpg')",
          backgroundColor: "#042F2E",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#042F2E]/92 via-[#042F2E]/80 to-[#0F766E]/70 backdrop-blur-[1px]" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <div className="space-y-8">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/LogoNoBG.png"
                  alt="TEREA Logo"
                  className="h-10 w-10 object-contain drop-shadow-md"
                />
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  TEREA
                </span>
              </div>
              <span className="inline-block rounded-md bg-white/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-teal-100 uppercase backdrop-blur-xs">
                Clinical Care & Triage Platform
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-4xl">
                Secure clinical portal for tuberculosis care coordination.
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-slate-200 font-normal">
                Unified workstation for authorized doctors, healthcare workers, and clinic administrators managing patient cohorts in Carmona.
              </p>
            </div>

            <div className="grid max-w-lg gap-3 sm:grid-cols-2 pt-2">
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 text-xs font-semibold text-white backdrop-blur-md shadow-xs">
                <ShieldCheck className="h-5 w-5 text-teal-300 shrink-0" />
                <span>Patient Triage Queue</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 text-xs font-semibold text-white backdrop-blur-md shadow-xs">
                <Stethoscope className="h-5 w-5 text-teal-300 shrink-0" />
                <span>Adherence Surveillance</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3.5 text-xs font-semibold text-white backdrop-blur-md shadow-xs sm:col-span-2">
                <Building2 className="h-5 w-5 text-teal-300 shrink-0" />
                <span>Carmona Health Center Network</span>
              </div>
            </div>
          </div>

          <p className="border-t border-white/15 pt-6 text-xs text-slate-300">
            © 2026 TEREA • City Government of Carmona Healthcare System
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Sign In Form */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-5 sm:p-10 lg:p-12">
        <div className="w-full max-w-[480px] space-y-7 rounded-2xl border border-slate-300/80 bg-white p-7 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </button>
            <span className="text-[11px] font-semibold text-slate-400">
              Portal v1.0
            </span>
          </div>

          <div className="lg:hidden flex flex-col items-center text-center pt-2">
            <img
              src="/LogoNoBG.png"
              alt="TEREA Logo"
              className="h-10 w-10 mb-1 object-contain drop-shadow-xs"
            />
            <h1 className="text-xl font-bold text-slate-900">TEREA</h1>
            <p className="text-[10px] font-bold text-teal-700 tracking-wider uppercase">
              Clinical Triage Platform
            </p>
          </div>

          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Log in
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Enter your authorized staff credentials to access patient records.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
                <AlertCircle className="mr-2.5 h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="role"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Access Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger
                  id="role"
                  className="h-11 rounded-xl border-slate-300 bg-slate-50/70 text-slate-800 transition-all focus:border-teal-700 focus:ring-teal-700"
                >
                  <SelectValue placeholder="Select authorization role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                  <SelectItem value="doctor" className="cursor-pointer font-medium">
                    Attending Physician / Health Worker
                  </SelectItem>
                  <SelectItem value="admin" className="cursor-pointer font-medium">
                    System Administrator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Staff Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="clinician@carmona.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-slate-300 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 transition-all focus-visible:border-teal-700 focus-visible:ring-teal-700"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
                >
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => openSupportModal("Password Reset Request")}
                  className="text-xs font-semibold text-teal-700 transition-colors hover:text-teal-900"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-slate-300 bg-slate-50/70 pr-10 text-slate-800 placeholder:text-slate-400 transition-all focus-visible:border-teal-700 focus-visible:ring-teal-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-3 h-11 w-full rounded-xl bg-teal-700 text-sm font-bold text-white shadow-md hover:bg-teal-800 transition-all hover:shadow-lg"
              disabled={isLoading || isSuccess}
            >
              {isLoading && !isSuccess ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : isSuccess ? (
                "Verified"
              ) : (
                <>
                  <Lock className="mr-1.5 h-4 w-4" /> Sign In
                </>
              )}
            </Button>
          </form>

          <div className="border-t border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Need staff authorization?{" "}
              <button
                type="button"
                onClick={() => openSupportModal("General IT Support")}
                className="font-bold text-teal-700 hover:text-teal-900 transition-colors"
              >
                Contact Health IT Support
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* SUCCESS OVERLAY */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs transition-all duration-300 ${
          isSuccess ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className={`flex flex-col items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.2)] transition-all duration-500 ${
            isSuccess ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 border border-teal-200">
            <CheckCircle2 className="h-8 w-8 text-teal-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Authorization Confirmed
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Redirecting to your workstation...
            </p>
          </div>

          <div className="mt-2 flex gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-700" style={{ animationDelay: "0ms" }}></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-700" style={{ animationDelay: "150ms" }}></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-700" style={{ animationDelay: "300ms" }}></span>
          </div>
        </div>
      </div>

      {/* IT SUPPORT MODAL */}
      <div
        className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-xs transition-all duration-300 p-4 ${
          isSupportModalOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className={`w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl transition-all duration-400 ${
            isSupportModalOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 border border-teal-200">
                <Headset className="h-4 w-4 text-teal-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Carmona Health IT Support
                </h3>
                <p className="text-[10px] text-slate-500">
                  Administrative technical ticket
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSupportModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5">
            {supportStatus === "success" ? (
              <div className="py-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Ticket Submitted Successfully
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    Your request has been forwarded to the IT administrator. Instructions will be sent to your email.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3.5">
                {supportError && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{supportError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Issue Category
                  </Label>
                  <Select value={supportType} onValueChange={setSupportType}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-300 text-xs text-slate-800">
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 bg-white">
                      <SelectItem value="Password Reset Request" className="text-xs">
                        Password Reset Request
                      </SelectItem>
                      <SelectItem value="Account Locked" className="text-xs">
                        Account Locked
                      </SelectItem>
                      <SelectItem value="System Bug" className="text-xs">
                        System Bug / Clinical Data Sync
                      </SelectItem>
                      <SelectItem value="General IT Support" className="text-xs">
                        General Technical Support
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Staff Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@carmona.gov.ph"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 border-slate-300 text-xs text-slate-800 focus-visible:border-teal-700 focus-visible:ring-teal-700"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Inquiry Details
                  </Label>
                  <textarea
                    placeholder="Please specify details regarding your account issue..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full min-h-[90px] rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={supportStatus === "loading"}
                  className="w-full h-10 rounded-xl bg-teal-700 hover:bg-teal-800 font-bold text-xs text-white shadow-xs transition-colors"
                >
                  {supportStatus === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Support Ticket"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}