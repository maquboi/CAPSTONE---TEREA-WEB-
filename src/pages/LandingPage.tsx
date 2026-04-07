import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
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
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        setParallaxY(Math.min(window.scrollY * 0.06, 26));
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="landing-green-wash relative min-h-screen overflow-hidden bg-[#F4F7F4] font-sans selection:bg-[#DDE5B6] selection:text-[#2D3B1E]">
      <div className="ambient-mesh" aria-hidden="true" />
      <div className="ambient-blob blob-one" aria-hidden="true" />
      <div className="ambient-blob blob-two" aria-hidden="true" />
      <div className="ambient-blob blob-three" aria-hidden="true" />
      
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[#606C38]/25 bg-[#F4F7F4]/88 backdrop-blur-xl shadow-[0_8px_30px_rgba(45,59,30,0.11)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="logo-badge flex h-9 w-9 items-center justify-center rounded-xl bg-[#606C38] shadow-sm">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#2D3B1E]">TEREA</span>
          </div>
          
          <Button 
            className="btn-premium border-2 border-[#606C38]/35 bg-[#DDE5B6]/45 text-[#2D3B1E] hover:bg-[#606C38] hover:text-white hover:border-[#606C38] rounded-xl font-semibold"
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#F4F7F4]/90 via-[#DDE5B6]/30 to-[#F4F7F4]/88 backdrop-blur-[2px]"></div>

        <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-24 lg:py-28">
          <div className="hero-layout grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center xl:gap-12">
            <div className="hero-copy space-y-5 lg:pr-4">
              <h1 className="landing-reveal-up text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] text-[#2D3B1E] lg:text-6xl drop-shadow-sm" style={{ animationDelay: "170ms" }}>
                Your TB recovery,<br/>
                <span className="text-[#606C38]">in your hands.</span>
              </h1>
              <p className="landing-text-fade max-w-xl text-base font-medium leading-relaxed tracking-[0.01em] text-slate-600 md:text-lg" style={{ animationDelay: "260ms" }}>
                TEREA's mobile app empowers patients in Carmona to track symptoms, follow medication schedules, and stay connected with their assigned healthcare team — all from their phone.
              </p>
              <div className="landing-reveal-up flex flex-wrap items-center gap-5 text-sm font-semibold text-[#2D3B1E]/90" style={{ animationDelay: "320ms" }}>
                <span>Trusted by local healthcare teams</span>
                <span className="h-1 w-1 rounded-full bg-[#606C38]/60" />
                <span>Real-time patient monitoring</span>
              </div>
              <div className="landing-reveal-up flex flex-wrap gap-3 pt-2" style={{ animationDelay: "340ms" }}>
                <Button className="btn-premium group h-12 gap-2 rounded-xl border-0 bg-[#606C38] px-8 font-bold text-white hover:bg-[#2D3B1E] sm:min-w-[215px]">
                  Download for Android <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button className="btn-premium group h-12 gap-2 rounded-xl border-2 border-[#606C38]/35 bg-[#DDE5B6]/40 text-[#2D3B1E] px-8 font-bold hover:bg-[#F4F7F4] hover:border-[#606C38] sm:min-w-[190px]">
                  Download for iOS <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="hero-device-wrap landing-reveal-up flex justify-center lg:justify-end lg:pl-4" style={{ animationDelay: "220ms" }}>
              <div className="transition-transform duration-500 ease-in-out" style={{ transform: `translateY(${parallaxY}px)` }}>
                <div className="phone-float relative">
                  <div className="absolute -inset-7 -z-10 rounded-full bg-gradient-to-br from-[#DDE5B6]/60 via-[#F4F7F4]/40 to-[#606C38]/35 blur-2xl" />
                  <div className="absolute -inset-2 rounded-[2.9rem] bg-gradient-to-br from-[#DDE5B6] via-[#606C38]/30 to-[#606C38] opacity-55 blur-xl"></div>
                  <div className="relative flex h-[520px] w-[270px] flex-col rounded-[2.5rem] border-[6px] border-white bg-[#F8F9FA]/95 p-4 shadow-[0_28px_60px_rgba(45,59,30,0.22),0_12px_24px_rgba(45,59,30,0.12)] backdrop-blur-sm">
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
                    <div className="glass-card rounded-2xl p-4 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                      <p className="text-xs font-bold text-[#606C38]">For Follow-up</p>
                    </div>
                    <div className="glass-card rounded-2xl p-4 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next Appointment</p>
                      <p className="text-xs font-bold text-[#2D3B1E]">Feb 18, 2026 — 3 days</p>
                    </div>
                    <div className="glass-card rounded-2xl p-4 space-y-1">
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
          </div>
        </section>
      </div>

      {/* Features Section */}
      <section className="section-tint relative py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center md:mb-20">
            <h2 className="landing-reveal-up text-3xl font-extrabold tracking-[-0.02em] text-[#2D3B1E]" style={{ animationDelay: "80ms" }}>What patients can do</h2>
            <p className="landing-text-fade mt-3 text-lg font-medium text-slate-500" style={{ animationDelay: "160ms" }}>Everything needed to stay on track with the TB treatment plan.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card glass-card landing-reveal-up rounded-2xl p-8 space-y-4 transition-all duration-500 ease-in-out hover:-translate-y-1.5 hover:border-[#606C38]/30" style={{ animationDelay: `${220 + i * 90}ms` }}>
                <div className="feature-icon-wrap flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-[#DDE5B6]/50">
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
      <section className="journey-section relative overflow-hidden border-t border-[#606C38]/25 py-24 md:py-28">
        <div className="journey-glow journey-glow-left" aria-hidden="true" />
        <div className="journey-glow journey-glow-right" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="landing-reveal-up text-3xl font-extrabold tracking-[-0.02em] text-[#2D3B1E] md:text-4xl" style={{ animationDelay: "120ms" }}>How to get started</h2>
            <p className="landing-text-fade mt-3 text-lg font-medium text-slate-500" style={{ animationDelay: "180ms" }}>Four simple steps to begin your monitored recovery journey.</p>
          </div>

          <div className="relative">
            <div className="journey-track hidden sm:block" aria-hidden="true" />
            <div className="grid gap-6 sm:grid-cols-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`step-card glass-card landing-reveal-up flex items-start gap-5 rounded-2xl p-6 transition-all duration-500 ease-in-out hover:-translate-y-1 hover:border-[#606C38]/30 ${i % 2 === 0 ? "sm:-translate-y-2" : "sm:translate-y-2"}`}
                  style={{ animationDelay: `${210 + i * 80}ms` }}
                >
                  <div className="step-index-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#606C38]/25 bg-[#DDE5B6]/40">
                    <div className="step-index flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDE5B6]/65 text-base font-extrabold text-[#2D3B1E]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#606C38]/80">Step {String(i + 1).padStart(2, "0")}</p>
                    <p className="text-[#2D3B1E] font-semibold text-base leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#606C38]/25 bg-[#F4F7F4] py-10">
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
            className="btn-premium group h-10 rounded-xl border border-[#DDE5B6] bg-transparent px-5 font-bold text-[#2D3B1E] hover:bg-[#606C38] hover:text-white"
            onClick={() => navigate("/login")}
          >
            Staff Portal <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </footer>
    </div>
  );
}