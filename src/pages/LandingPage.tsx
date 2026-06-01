import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  Users,
  BellRing,
  Activity
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Automated Risk Triage",
    description: "Risk assessments instantly categorize patients by risk level, allowing you to prioritize critical cases.",
  },
  {
    icon: LineChart,
    title: "Real-time Compliance",
    description: "Monitor medication adherence and treatment roadmaps for your entire patient population in one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "TB-DOTS Standardized",
    description: "Built to align with DOH protocols, ensuring your clinic maintains high standards of documentation and care.",
  },
];

const steps = [
  "Patients submit their mobile risk assessment and daily symptom logs.",
  "TEREA algorithms flag medium-to-high risk profiles to your dashboard.",
  "Doctors review patient data, confirm diagnoses, and set treatment roadmaps.",
  "The system automatically tracks patient medication adherence over the 6-month period.",
];

const carouselImages = [
  '/CarmonaStreets.jpg',
  '/CarmonaPlace.jpg',
  '/CityHallCarmona.jpg'
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [parallaxY, setParallaxY] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Carousel Interval
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    // Parallax Effect
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
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="landing-green-wash relative min-h-screen overflow-hidden bg-white font-sans selection:bg-[#DDE5B6] selection:text-[#2D3B1E]">
      <div className="ambient-mesh" aria-hidden="true" />
      <div className="ambient-blob blob-one" aria-hidden="true" />
      <div className="ambient-blob blob-two" aria-hidden="true" />
      <div className="ambient-blob blob-three" aria-hidden="true" />
      
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[#606C38]/15 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(45,59,30,0.06)]">
        <div className="flex h-16 w-full items-center justify-between px-6 sm:px-10">
          <div className="flex items-center">
            <span className="text-xl font-extrabold tracking-tight text-[#2D3B1E]">TEREA</span>
          </div>
          
          <Button 
            className="btn-premium border-2 border-[#606C38]/30 bg-[#DDE5B6]/30 text-[#2D3B1E] hover:bg-[#606C38] hover:text-white hover:border-[#606C38] rounded-xl font-semibold"
            onClick={() => navigate("/login")}
          >
            Staff Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Carousel Background Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-[3px] scale-105 transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url('${carouselImages[currentImageIndex]}')`,
          }}
        ></div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-[#DDE5B6]/50 to-white/95"></div>

        <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-24 lg:py-28">
          <div className="hero-layout grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center xl:gap-12">
            <div className="hero-copy space-y-5 lg:pr-4">
              <h1 className="landing-reveal-up text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] text-[#2D3B1E] lg:text-6xl drop-shadow-sm" style={{ animationDelay: "170ms" }}>
                Risk Assessment and Healthcare Management<br/>
              </h1>
              <p className="landing-text-fade max-w-xl text-base font-medium leading-relaxed tracking-[0.01em] text-[#2D3B1E]/80 md:text-lg" style={{ animationDelay: "260ms" }}>
                TEREA empowers healthcare providers in Carmona with a dashboard to monitor patient compliance, triage risks, and streamline clinical workflows in real-time.
              </p>
              <div className="landing-reveal-up flex flex-wrap items-center gap-5 text-sm font-semibold text-[#2D3B1E]/90" style={{ animationDelay: "320ms" }}>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-[#606C38]" /> Patient Tracking</span>
                <span className="h-1 w-1 rounded-full bg-[#606C38]/60" />
                <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-[#606C38]" /> Automated Triage</span>
              </div>
              <div className="landing-reveal-up flex items-center gap-2 pt-4 text-xs font-semibold text-[#2D3B1E]/60" style={{ animationDelay: "380ms" }}>
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Compliant with the PH Data Privacy Act of 2012</span>
              </div>
            </div>

            <div className="hero-device-wrap landing-reveal-up flex justify-center lg:justify-end lg:pl-4" style={{ animationDelay: "220ms" }}>
              <div className="transition-transform duration-500 ease-in-out w-full max-w-md" style={{ transform: `translateY(${parallaxY}px)` }}>
                <div className="relative" style={{ perspective: "2000px" }}>
                  <div className="absolute -inset-7 -z-10 rounded-[2rem] bg-gradient-to-br from-[#DDE5B6]/50 via-white/60 to-[#606C38]/25 blur-2xl" />
                  
                  <div 
                    className="relative flex flex-col rounded-2xl border border-slate-200/50 bg-white/95 p-4 shadow-[0_28px_60px_rgba(45,59,30,0.12)] backdrop-blur-md transition-transform duration-700 hover:rotate-0 hover:scale-105"
                    style={{ transform: "rotateY(-12deg) rotateX(8deg) scale(0.95)" }}
                  >
                    <div className="flex gap-1.5 pb-4 border-b border-slate-100">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    
                    <div className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#2D3B1E]/50 uppercase tracking-wider">Clinic Overview</p>
                          <p className="text-lg font-bold text-[#2D3B1E]">Carmona Health Center</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-[#DDE5B6] flex items-center justify-center">
                          <BellRing className="h-4 w-4 text-[#606C38]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="glass-card rounded-xl p-3 bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold text-[#2D3B1E]/50">HIGH RISK</p>
                          <p className="text-xl font-bold text-red-600">12 Patients</p>
                        </div>
                        <div className="glass-card rounded-xl p-3 bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold text-[#2D3B1E]/50">NON-COMPLIANT</p>
                          <p className="text-xl font-bold text-amber-600">4 Alerts</p>
                        </div>
                      </div>

                      <div className="glass-card rounded-xl p-3 bg-[#FEFAE0]/40 border border-[#DDE5B6]/50 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-[#2D3B1E]">Recent Activity</p>
                          <span className="text-[10px] text-[#606C38] font-semibold">View All</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-100">
                          <div className="h-6 w-6 rounded-full bg-red-50 flex items-center justify-center">
                            <Activity className="h-3 w-3 text-red-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#2D3B1E]">Patient Assessment Flagged</p>
                            <p className="text-[8px] text-[#2D3B1E]/50">2 minutes ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Impact Stats */}
      <div className="relative z-20 mx-auto max-w-5xl px-6 -mt-8 sm:-mt-12">
        <div className="glass-card grid grid-cols-1 divide-y divide-slate-100 rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0 border border-slate-100">
          <div className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
            <h4 className="text-3xl font-extrabold text-[#2D3B1E]">Barangay</h4>
            <p className="text-xs font-bold uppercase tracking-wider text-[#606C38]">Carmona</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
            <h4 className="text-3xl font-extrabold text-[#2D3B1E]">Real-Time</h4>
            <p className="text-xs font-bold uppercase tracking-wider text-[#606C38]">Risk Triage</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
            <h4 className="text-3xl font-extrabold text-[#2D3B1E]">24/7</h4>
            <p className="text-xs font-bold uppercase tracking-wider text-[#606C38]">Compliance</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative bg-white py-24 md:py-28 z-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center md:mb-20">
            <h2 className="landing-reveal-up text-3xl font-extrabold tracking-[-0.02em] text-[#2D3B1E]" style={{ animationDelay: "80ms" }}>Empowering Healthcare Providers</h2>
            <p className="landing-text-fade mt-3 text-lg font-medium text-[#2D3B1E]/70" style={{ animationDelay: "160ms" }}>Tools designed specifically for medical staff to optimize the TB-DOTS program.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card glass-card landing-reveal-up rounded-2xl p-8 space-y-4 transition-all duration-500 ease-in-out hover:-translate-y-1.5 hover:border-[#606C38]/30 border border-slate-100 bg-white shadow-sm hover:shadow-md" style={{ animationDelay: `${220 + i * 90}ms` }}>
                <div className="feature-icon-wrap flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 shadow-sm border border-slate-100">
                  <f.icon className="h-6 w-6 text-[#606C38]" />
                </div>
                <h3 className="font-bold text-[#2D3B1E] text-lg">{f.title}</h3>
                <p className="text-sm text-[#2D3B1E]/70 leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="journey-section relative overflow-hidden py-24 md:py-28 bg-white border-t border-slate-100">
        <div className="journey-glow journey-glow-left opacity-40" aria-hidden="true" />
        <div className="journey-glow journey-glow-right opacity-40" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="landing-reveal-up text-3xl font-extrabold tracking-[-0.02em] text-[#2D3B1E] md:text-4xl" style={{ animationDelay: "120ms" }}>The Clinical Workflow</h2>
            <p className="landing-text-fade mt-3 text-lg font-medium text-[#2D3B1E]/70" style={{ animationDelay: "180ms" }}>How TEREA bridges the gap between patient reporting and medical oversight.</p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-8 bottom-8 hidden w-px -translate-x-1/2 border-l-2 border-dashed border-[#606C38]/20 sm:block" aria-hidden="true" />
            
            <div className="grid gap-6 sm:grid-cols-2 relative z-10">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`step-card glass-card landing-reveal-up flex items-start gap-5 rounded-2xl p-6 transition-all duration-500 ease-in-out hover:-translate-y-1 hover:border-[#606C38]/30 bg-white border border-slate-100 shadow-sm hover:shadow-md ${i % 2 === 0 ? "sm:-translate-y-2" : "sm:translate-y-2"}`}
                  style={{ animationDelay: `${210 + i * 80}ms` }}
                >
                  <div className="step-index-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#606C38]/20 bg-[#DDE5B6]/20">
                    <div className="step-index flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDE5B6]/50 text-base font-extrabold text-[#2D3B1E]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#606C38]/80">Phase {String(i + 1).padStart(2, "0")}</p>
                    <p className="text-[#2D3B1E] font-semibold text-base leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div>
              <p className="text-sm font-semibold text-[#2D3B1E]/80">
                © 2026 TEREA. Municipality of Carmona.
              </p>
              <p className="text-xs font-medium text-[#2D3B1E]/50 mt-1 sm:mt-0.5">
                Powered by React, Supabase, and AI.
              </p>
            </div>
          </div>
        
          <Button 
            className="btn-premium group h-10 rounded-xl border border-slate-200 bg-white shadow-sm px-5 font-bold text-[#2D3B1E] hover:bg-[#606C38] hover:text-white hover:border-[#606C38]"
            onClick={() => navigate("/login")}
          >
            Staff Portal <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </footer>
    </div>
  );
}