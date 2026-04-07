import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, ShieldCheck, Stethoscope } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !role) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // 1. REAL LOGIN: Check credentials with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Invalid email or password");
      }

      if (!authData.user) throw new Error("User not found");

      // 2. VERIFY ROLE: Check the 'profiles' table for the actual role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found. Contact IT support.");
      }

      // 3. SECURITY CHECK: Ensure the selected role matches the database role
      if (profile.role !== role) {
        throw new Error(`This account is not registered as a ${role}.`);
      }

      // 4. SUCCESS: Navigate to the correct dashboard
      if (profile.role === "admin") {
        navigate("/admin/dashboard");
      } else if (profile.role === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        setError("Unauthorized access.");
      }

    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell relative flex min-h-screen overflow-hidden bg-[#F4F7F4]">
      <div className="auth-ambient auth-blob-one" aria-hidden="true" />
      <div className="auth-ambient auth-blob-two" aria-hidden="true" />

      <div
        className="relative hidden lg:flex lg:w-[52%] bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')",
          backgroundColor: "#DDE5B6"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D3B1E]/90 via-[#2D3B1E]/74 to-[#606C38]/70" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-14">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/35 bg-white/20 shadow-lg backdrop-blur-md">
                <span className="text-2xl font-extrabold text-white">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">TEREA</h1>
                <p className="text-xs font-semibold tracking-[0.14em] text-[#DDE5B6]">TB RISK ASSESSMENT PLATFORM</p>
              </div>
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
                <span>Role-based access control</span>
              </div>
              <div className="auth-info-card">
                <Stethoscope className="h-5 w-5 text-[#DDE5B6]" />
                <span>Doctor workflow ready</span>
              </div>
              <div className="auth-info-card sm:col-span-2">
                <Building2 className="h-5 w-5 text-[#DDE5B6]" />
                <span>Built for Municipality of Carmona health operations</span>
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

          <div className="lg:hidden flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#606C38] shadow-md">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2D3B1E]">TEREA</h1>
              <p className="text-xs font-semibold tracking-wider text-[#606C38]">RISK ASSESSMENT</p>
            </div>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="border-t border-[#606C38]/15 pt-5 text-center">
            <p className="text-sm text-slate-500">
              Need access?{" "}
              <button className="font-semibold text-[#606C38] transition-colors hover:text-[#2D3B1E]">
                Contact IT Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}