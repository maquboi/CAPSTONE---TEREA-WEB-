import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// FIXED: Import Supabase to enable real login
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
      // Show actual error message
      setError(err.message || "Failed to sign in");
      // If login failed, make sure we aren't holding onto a session
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary">
              <span className="text-2xl font-bold text-sidebar-primary-foreground">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground tracking-tight">TEREA</h1>
              <p className="text-sm text-sidebar-muted">TB Risk Assessment Platform</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-sidebar-foreground leading-tight">
              Empowering Carmona's<br />
              Fight Against TB
            </h2>
            <p className="text-sidebar-muted max-w-md">
              AI-assisted risk assessment and patient monitoring platform designed 
              for healthcare workers in the Municipality of Carmona.
            </p>
          </div>

          <div className="flex gap-6 text-sm text-sidebar-muted">
            <div>
              <p className="text-2xl font-semibold text-sidebar-foreground">1,234</p>
              <p>Patients Monitored</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-sidebar-foreground">16</p>
              <p>Barangays Covered</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-sidebar-foreground">98%</p>
              <p>Follow-up Rate</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-sidebar-muted">
          © 2025 TEREA. Municipality of Carmona Health Office.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">TEREA</h1>
              <p className="text-sm text-muted-foreground">TB Risk Assessment</p>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to access the TEREA dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Sign in as</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="bg-card">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="doctor">Doctor / Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@carmona.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
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
                  className="bg-card pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* FIXED: Removed size="lg" to prevent crash, replaced with explicit height/width */}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Need help?{" "}
            <button className="text-primary hover:underline">
              Contact IT Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}