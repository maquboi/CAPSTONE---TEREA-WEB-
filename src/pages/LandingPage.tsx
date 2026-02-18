import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
// FIXED: Changed the path to correctly point to your new lib folder
import { supabase } from "../lib/supabase"; 
import {
  Smartphone,
  Shield,
  Activity,
  CalendarCheck,
  Pill,
  Weight,
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
  {
    icon: Weight,
    title: "Weight Monitoring",
    description: "Log your weight regularly so your doctor can monitor your recovery progress.",
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
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">T</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">TEREA</span>
          </div>
          <Button 
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            onClick={() => navigate("/login")}
          >
            Staff Login
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              Available on iOS & Android
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl">
              Your TB recovery,{" "}
              <span className="text-primary">in your hands.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              TEREA's mobile app empowers patients in Carmona to track symptoms, follow medication schedules, and stay connected with their assigned healthcare team — all from their phone.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="h-11 rounded-md px-8 gap-2">
                Download for Android <ArrowRight className="h-4 w-4" />
              </Button>
              <Button className="h-11 rounded-md px-8 gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground">
                Download for iOS <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-[500px] w-[260px] rounded-[2.5rem] border-4 border-foreground/10 bg-card shadow-xl p-4 flex flex-col">
                <div className="flex items-center justify-between px-2 pb-3 text-xs text-muted-foreground">
                  <span>9:41</span>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-4">
                  <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">T</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">TEREA Patient</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="rounded-xl bg-muted p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <p className="text-xs font-medium text-primary">For Follow-up</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground">Next Appointment</p>
                    <p className="text-xs font-medium text-foreground">Feb 18, 2026 — 3 days</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground">Today's Medication</p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs text-foreground">Isoniazid — Taken</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground">Weight Log</p>
                    <p className="text-xs font-medium text-foreground">62.5 kg <span className="text-primary text-[10px]">↑ 0.3kg</span></p>
                  </div>
                </div>
                <div className="flex justify-around pt-3 border-t border-border">
                  {[Activity, CalendarCheck, Pill, Weight].map((Icon, i) => (
                    <Icon key={i} className={`h-4 w-4 ${i === 0 ? "text-primary" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-foreground">What patients can do</h2>
            <p className="mt-2 text-muted-foreground">Everything you need to stay on track with your TB treatment.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 space-y-3 card-hover">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground">How to get started</h2>
              <p className="mt-2 mb-8 text-muted-foreground">Four simple steps to begin your monitored recovery journey.</p>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                    <p className="text-foreground pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Your data is safe</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                TEREA complies with Philippine data privacy regulations. All patient health information is encrypted and only accessible by your assigned healthcare provider and authorized administrators.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">16</p>
                  <p className="text-xs text-muted-foreground">Barangays</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">1,234</p>
                  <p className="text-xs text-muted-foreground">Patients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">98%</p>
                  <p className="text-xs text-muted-foreground">Follow-up Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 TEREA. Municipality of Carmona Health Office.
          </p>
          <Button 
            className="h-9 rounded-md px-3 hover:bg-accent hover:text-accent-foreground"
            onClick={() => navigate("/login")}
          >
            Staff Portal →
          </Button>
        </div>
      </footer>
    </div>
  );
}