import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Left side - Branding (Hidden on mobile, stylized with theme colors) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2D3B1E] to-[#606C38] flex-col justify-between p-12 text-white shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FEFAE0] opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEFAE0]/20 backdrop-blur-sm shadow-inner border border-white/10">
              <span className="text-3xl font-extrabold text-white">T</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">TEREA</h1>
              <p className="text-sm text-[#FEFAE0]/80 font-medium tracking-wide">TB Risk Assessment Platform</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Empowering Carmona's<br />
              <span className="text-[#FEFAE0]">Fight Against TB</span>
            </h2>
            <p className="text-white/80 max-w-md leading-relaxed text-lg">
              AI-assisted risk assessment and patient monitoring platform designed 
              for healthcare workers in the Municipality of Carmona.
            </p>
          </div>

          <div className="flex gap-10 text-sm">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-[#FEFAE0]">1,234</p>
              <p className="text-white/70 font-medium uppercase tracking-wider text-xs">Patients Monitored</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-[#FEFAE0]">16</p>
              <p className="text-white/70 font-medium uppercase tracking-wider text-xs">Barangays Covered</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-[#FEFAE0]">98%</p>
              <p className="text-white/70 font-medium uppercase tracking-wider text-xs">Follow-up Rate</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/50 relative z-10">
          © 2026 TEREA. Municipality of Carmona Health Office.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-[#DDE5B6]/50 space-y-8 animate-fade-in">
          
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#606C38] shadow-md">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2D3B1E]">TEREA</h1>
              <p className="text-xs text-muted-foreground font-medium">TB Risk Assessment</p>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-[#2D3B1E]">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center">
                <div className="bg-red-100 p-1 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role" className="text-[#2D3B1E] font-semibold text-xs uppercase tracking-wider">Sign in as</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="bg-[#F8F9FA] border-[#DDE5B6] h-12 rounded-xl focus:ring-[#606C38]">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#DDE5B6]">
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="doctor">Doctor / Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#2D3B1E] font-semibold text-xs uppercase tracking-wider">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@carmona.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#F8F9FA] border-[#DDE5B6] h-12 rounded-xl focus-visible:ring-[#606C38]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#2D3B1E] font-semibold text-xs uppercase tracking-wider">Password</Label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#606C38] hover:text-[#2D3B1E] hover:underline transition-colors"
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
                  className="bg-[#F8F9FA] border-[#DDE5B6] h-12 rounded-xl pr-10 focus-visible:ring-[#606C38]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#606C38] transition-colors"
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
              className="w-full h-12 mt-2 bg-[#606C38] hover:bg-[#2D3B1E] text-white rounded-xl shadow-md transition-all font-bold text-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign in securely"
              )}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-sm text-muted-foreground mt-4">
              Need access?{" "}
              <button className="font-semibold text-[#606C38] hover:text-[#2D3B1E] hover:underline transition-colors">
                Contact IT Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}