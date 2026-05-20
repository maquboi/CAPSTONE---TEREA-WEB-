import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if we actually have a secure recovery session when the page loads
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError("Invalid or expired password reset link. Please request a new one from IT Support.");
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // Securely update the user's password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7F4] p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(45,59,30,0.08)] border border-[#606C38]/10">
        
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#606C38] shadow-sm">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#2D3B1E]">Set New Password</h2>
          <p className="mt-2 text-sm text-slate-500">Please enter a strong password for your TEREA account.</p>
        </div>

        {isSuccess ? (
          <div className="rounded-2xl bg-green-50 p-6 text-center border border-green-100 animate-fade-in">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-green-600" />
            <h3 className="font-bold text-green-800">Password Updated!</h3>
            <p className="mt-1 text-sm text-green-600">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 focus-visible:ring-[#606C38]"
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-[#2D3B1E]">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 focus-visible:ring-[#606C38]"
                placeholder="Confirm new password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#606C38] font-bold text-white hover:bg-[#4A5529] mt-2"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}