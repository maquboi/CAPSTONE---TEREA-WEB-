import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "../lib/supabase"; 
import {
  Smartphone,
  Activity,
  CalendarCheck,
  Pill,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Symptom Reporting",
    description: "Report and track symptoms directly from your phone. Your doctor gets notified instantly.",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Tracking",
    description: "View upcoming check-ups and follow-up schedules set by your assigned doctor.",
  },
  {
    icon: Pill,
    title: "Medication Diary",
    description: "Track your daily medication intake and stay compliant with your treatment plan.",
  },
];

const steps = [
  "Download the TEREA app from the App Store or Google Play",
  "Register using your patient ID provided by your barangay health center",
  "Complete the AI-assisted TB risk assessment",
  "Get matched with a doctor if flagged as high risk",
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F4F7F4] font-sans selection:bg-[#DDE5B6] selection:text-[#2D3B1E]">
      
      {/* Nav */}
      <header className="border-b border-[#DDE5B6]/50 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#606C38] shadow-sm">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#2D3B1E]">TEREA</span>
          </div>
          
          <Button 
            className="border-2 border-[#DDE5B6] bg-transparent text-[#2D3B1E] hover:bg-[#606C38] hover:text-white hover:border-[#606C38] transition-all font-semibold shadow-none rounded-xl"
            onClick={() => navigate("/login")}
          >
            Staff Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2000&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-[#F4F7F4]/80 backdrop-blur-[2px]"></div>

        <section className="relative mx-auto max-w-6xl px-6 py-24 z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DDE5B6] bg-white/80 px-4 py-1.5 text-sm font-medium text-[#606C38] shadow-sm">
                <Smartphone className="h-4 w-4" />
                Available on iOS & Android
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#2D3B1E] lg:text-5xl drop-shadow-sm">
                Your TB recovery,<br/>
                <span className="text-[#606C38]">in your hands.</span>
              </h1>
              <p className="max-w-lg text-lg text-slate-600 font-medium leading-relaxed">
                TEREA's mobile app empowers patients in Carmona to track symptoms, follow medication schedules, and stay connected with their assigned healthcare team — all from their phone.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button className="h-12 rounded-xl px-8 gap-2 bg-[#606C38] hover:bg-[#2D3B1E] text-white shadow-md font-bold transition-all border-0">
                  Download for Android <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="h-12 rounded-xl px-8 gap-2 border-2 border-[#DDE5B6] bg-white text-[#2D3B1E] hover:bg-[#F4F7F4] hover:border-[#606C38] font-bold transition-all shadow-sm">
                  Download for iOS <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative transform hover:-translate-y-2 transition-transform duration-500">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#DDE5B6] to-[#606C38] rounded-[2.8rem] blur opacity-30"></div>
                <div className="relative h-[520px] w-[270px] rounded-[2.5rem] border-[6px] border-white bg-[#F8F9FA] shadow-2xl p-4 flex flex-col">
                  <div className="flex items-center justify-between px-2 pb-3 text-xs font-semibold text-slate-400">
                    <span>9:41</span>
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-[#606C38]" />
                      <div className="h-2 w-2 rounded-full bg-[#606C38]/50" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <div className="h-8 w-8 rounded-xl bg-[#606C38] flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-white">T</span>
                    </div>
                    <span className="text-sm font-bold text-[#2D3B1E]">TEREA Patient</span>
                  </div>
                  
                  <div className="flex-1 space-y-4 pt-6">
                    <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-1 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                      <p className="text-xs font-bold text-[#606C38]">For Follow-up</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-1 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next Appointment</p>
                      <p className="text-xs font-bold text-[#2D3B1E]">Feb 18, 2026 — 3 days</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-1 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Medication</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="h-4 w-4 text-[#606C38]" />
                        <span className="text-xs font-semibold text-[#2D3B1E]">Isoniazid — Taken</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-around pt-4 pb-2 border-t border-slate-100">
                    {[Activity, CalendarCheck, Pill].map((Icon, i) => (
                      <Icon key={i} className={`h-6 w-6 ${i === 0 ? "text-[#606C38]" : "text-slate-300"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features Section */}
      <section className="bg-white py-24 relative">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold text-[#2D3B1E]">What patients can do</h2>
            <p className="mt-3 text-lg text-slate-500 font-medium">Everything needed to stay on track with the TB treatment plan.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#DDE5B6]/60 bg-[#F8F9FA] p-8 space-y-4 hover:shadow-lg hover:border-[#606C38]/30 hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-[#DDE5B6]/50">
                  <f.icon className="h-6 w-6 text-[#606C38]" />
                </div>
                <h3 className="font-bold text-[#2D3B1E] text-lg">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section - Centered Layout */}
      <section className="py-24 bg-[#F4F7F4] border-t border-[#DDE5B6]/30">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#2D3B1E]">How to get started</h2>
            <p className="mt-3 text-lg text-slate-500 font-medium">Four simple steps to begin your monitored recovery journey.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-5 items-start bg-white p-6 rounded-2xl shadow-sm border border-[#DDE5B6]/40 hover:border-[#606C38]/30 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDE5B6]/50 text-base font-extrabold text-[#2D3B1E]">
                  {i + 1}
                </div>
                <p className="text-[#2D3B1E] pt-2 font-semibold text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DDE5B6] bg-white py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#606C38]">
              <span className="text-[10px] font-bold text-white">T</span>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              © 2026 TEREA. Municipality of Carmona.
            </p>
          </div>
          
          <Button 
            className="h-10 rounded-xl px-5 border border-[#DDE5B6] bg-transparent text-[#2D3B1E] hover:bg-[#606C38] hover:text-white font-bold transition-all shadow-none"
            onClick={() => navigate("/login")}
          >
            Staff Portal <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}