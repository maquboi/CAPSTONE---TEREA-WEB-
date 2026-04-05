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
    <div className="flex min-h-screen bg-[#F4F7F4] overflow-hidden">
      
      {/* Left side - Image Placeholder & Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{ 
          // 👉 PASTE YOUR BACKGROUND IMAGE URL HERE:
          backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')",
          backgroundColor: "#DDE5B6" // Fallback color while image loads
        }}
      >
        {/* Modern Gradient Overlay: Keeps the top light/transparent and bottoms dark for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D3B1E]/95 via-[#2D3B1E]/50 to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Top Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-sm border border-white/30">
              <span className="text-2xl font-extrabold text-white">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">TEREA</h1>
              <p className="text-xs text-white/90 font-medium tracking-wide drop-shadow-md">TB Risk Assessment Platform</p>
            </div>
          </div>

          {/* Bottom Content */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-4xl font-bold leading-tight text-white">
                Empowering Carmona's<br />
                <span className="text-[#DDE5B6]">Fight Against TB</span>
              </h2>
              <p className="text-white/80 max-w-md leading-relaxed text-base">
                AI-assisted risk assessment and patient monitoring platform designed 
                for healthcare workers in the Municipality of Carmona.
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 text-sm pt-4 border-t border-white/20">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-[#DDE5B6]">1,234</p>
                <p className="text-white/70 font-medium uppercase tracking-wider text-[10px]">Patients</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-[#DDE5B6]">16</p>
                <p className="text-white/70 font-medium uppercase tracking-wider text-[10px]">Barangays</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-[#DDE5B6]">98%</p>
                <p className="text-white/70 font-medium uppercase tracking-wider text-[10px]">Follow-up</p>
              </div>
            </div>
            
            <p className="text-xs text-white/50">
              © 2026 TEREA. Municipality of Carmona Health Office.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form (Lightened & Cleaned Up) */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-white lg:rounded-l-[2.5rem] lg:shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.05)] z-10">
        <div className="w-full max-w-[420px] space-y-8 animate-fade-in">
          
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#606C38] shadow-md">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2D3B1E]">TEREA</h1>
              <p className="text-xs text-slate-500 font-medium">TB Risk Assessment</p>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#2D3B1E]">Welcome back</h2>
            <p className="text-sm text-slate-500 font-medium">
              Sign in to your staff portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center">
                <div className="bg-red-100 p-1.5 rounded-full mr-3 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="role" className="text-[#2D3B1E] font-bold text-xs uppercase tracking-wide">Sign in as</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-700 focus:ring-[#606C38] focus:border-[#606C38] transition-all">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="admin" className="cursor-pointer">Administrator</SelectItem>
                  <SelectItem value="doctor" className="cursor-pointer">Doctor / Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-[#2D3B1E] font-bold text-xs uppercase tracking-wide">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@carmona.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-700 placeholder:text-slate-400 focus-visible:ring-[#606C38] focus-visible:border-[#606C38] transition-all"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#2D3B1E] font-bold text-xs uppercase tracking-wide">Password</Label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#606C38] hover:text-[#2D3B1E] transition-colors"
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
                  className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-700 pr-10 placeholder:text-slate-400 focus-visible:ring-[#606C38] focus-visible:border-[#606C38] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#606C38] transition-colors"
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
              className="w-full h-12 mt-6 bg-[#606C38] hover:bg-[#4A5529] text-white rounded-xl shadow-sm transition-all font-bold text-sm"
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

          <div className="pt-6 text-center">
            <p className="text-sm text-slate-500">
              Need access?{" "}
              <button className="font-semibold text-[#606C38] hover:text-[#2D3B1E] transition-colors">
                Contact IT Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}