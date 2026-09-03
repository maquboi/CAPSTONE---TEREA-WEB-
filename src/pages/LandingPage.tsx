import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LineChart,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  Users,
  BellRing,
  Activity,
  Download,
  Smartphone,
  Lock,
  QrCode,
  CheckCircle2,
} from "lucide-react";

const APK_DOWNLOAD_URL = "https://github.com/maquboi/CAPSTONE---TEREA-WEB-/releases/latest/download/TEREA-v1.0.apk";

const features = [
  {
    icon: ClipboardCheck,
    title: "Automated Risk Triage",
    description: "Risk assessments instantly categorize patients by risk level, allowing clinicians to prioritize critical cases.",
  },
  {
    icon: LineChart,
    title: "Real-time Compliance",
    description: "Monitor medication adherence and treatment roadmaps for your entire patient population in one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "TB-DOTS Guided Workflow",
    description: "Designed following the general principles of the DOH National TB Control Program to support local clinic documentation.",
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
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

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

  // Live QR Code generated via pure URL (no extra npm packages required)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(APK_DOWNLOAD_URL)}`;

  return (
    <div className="landing-green-wash relative min-h-screen overflow-hidden bg-white font-sans selection:bg-[#DDE5B6] selection:text-[#2D3B1E]">
      <div className="ambient-mesh" aria-hidden="true" />
      <div className="ambient-blob blob-one" aria-hidden="true" />
      <div className="ambient-blob blob-two" aria-hidden="true" />
      <div className="ambient-blob blob-three" aria-hidden="true" />
      
      {/* QR Code Scan Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl p-6 text-center bg-white border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#2D3B1E] text-center">
              Scan to Download APK
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center mt-1">
              Point your Android phone camera at the QR code to start downloading directly.
            </DialogDescription>
          </DialogHeader>

          <div className="my-5 flex flex-col items-center justify-center">
            <div className="p-3 bg-white border-2 border-[#DDE5B6] rounded-2xl shadow-sm">
              <img 
                src={qrCodeUrl} 
                alt="Scan to download TEREA APK" 
                className="h-48 w-48 rounded-xl object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Direct GitHub CDN Delivery</span>
            </div>
          </div>

          <div className="space-y-2">
            <a 
              href={APK_DOWNLOAD_URL}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#606C38] hover:bg-[#2D3B1E] py-2.5 rounded-xl transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Direct Download Link
            </a>
            <Button 
              variant="ghost" 
              onClick={() => setQrModalOpen(false)}
              className="w-full text-xs text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[#606C38]/15 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(45,59,30,0.06)]">
        <div className="flex h-16 w-full items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-2.5">
            <img src="/LogoNoBG.png" alt="TEREA Logo" className="h-8 w-8 object-contain drop-shadow-sm" />
            <span className="text-xl font-extrabold tracking-tight text-[#2D3B1E]">TEREA</span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5">
            <button 
              onClick={() => navigate("/login")}
              className="group flex items-center gap-1.5 text-sm font-semibold text-[#2D3B1E]/70 hover:text-[#606C38] transition-colors"
              title="Secure Staff Portal"
            >
              <Lock className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Staff Portal</span>
            </button>

            <Button
              variant="outline"
              onClick={() => setQrModalOpen(true)}
              className="hidden lg:flex items-center gap-2 border-[#DDE5B6] text-[#2D3B1E] hover:bg-[#FEFAE0] rounded-xl text-xs font-bold h-9"
            >
              <QrCode className="h-3.5 w-3.5 text-[#606C38]" />
              Scan QR
            </Button>

            <a 
              href={APK_DOWNLOAD_URL} 
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-[#606C38] hover:bg-[#4A5529] px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Download for Android</span>
              <span className="sm:hidden">Get APK</span>
            </a>
          </div>
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
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-[#DDE5B6]/50 to-white/95" />

        <section className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-20 lg:py-24">
          <div className="hero-layout grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center xl:gap-12">
            <div className="hero-copy space-y-6 lg:pr-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 border border-[#DDE5B6] rounded-full text-xs font-bold text-[#606C38] shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Municipality of Carmona TB DOTS Platform
              </div>

              <h1 className="landing-reveal-up text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-[-0.03em] text-[#2D3B1E] drop-shadow-sm">
                Risk Assessment & Clinical TB Management
              </h1>

              <p className="landing-text-fade max-w-xl text-base font-medium leading-relaxed tracking-[0.01em] text-[#2D3B1E]/80 md:text-lg">
                TEREA empowers healthcare workers and residents of Carmona with automated risk triage, daily medication adherence verification, and standardized DOH treatment roadmaps.
              </p>
              
              {/* Dual Action Download Area for Evaluators & Patients */}
              <div className="pt-2 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <a 
                    href={APK_DOWNLOAD_URL} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 text-base font-bold text-white bg-[#606C38] hover:bg-[#2D3B1E] px-6 py-3.5 rounded-2xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Smartphone className="h-5 w-5" />
                    Download Android App (.apk)
                    <Download className="h-4 w-4 ml-1" />
                  </a>

                  <Button
                    variant="outline"
                    onClick={() => setQrModalOpen(true)}
                    className="h-[52px] rounded-2xl border-slate-300 bg-white/80 hover:bg-white text-[#2D3B1E] font-bold gap-2 px-5 shadow-xs"
                  >
                    <QrCode className="h-4 w-4 text-[#606C38]" />
                    Scan with Phone
                  </Button>
                </div>

                <p className="text-xs text-[#2D3B1E]/60 font-medium">
                  Verified APK • Android 8.0+ • Official Release v1.0
                </p>
              </div>

              <div className="landing-reveal-up flex flex-wrap items-center gap-5 text-sm font-semibold text-[#2D3B1E]/90 pt-2">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-[#606C38]" /> Patient Tracking</span>
                <span className="h-1 w-1 rounded-full bg-[#606C38]/60" />
                <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-[#606C38]" /> Automated Triage</span>
                <span className="h-1 w-1 rounded-full bg-[#606C38]/60" />
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> DOH NTP Protocols</span>
              </div>
            </div>

            <div className="hero-device-wrap landing-reveal-up flex justify-center lg:justify-end lg:pl-4">
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
                          <span className="text-[10px] text-[#606C38] font-semibold">Live Queue</span>
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
            <p className="text-xs font-bold uppercase tracking-wider text-[#606C38]">Carmona Coverage</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
            <h4 className="text-3xl font-extrabold text-[#2D3B1E]">Real-Time</h4>
            <p className="text-xs font-bold uppercase tracking-wider text-[#606C38]">Clinical Triage</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
            <h4 className="text-3xl font-extrabold text-[#2D3B1E]">6-Month</h4>
            <p className="text-xs font-bold uppercase tracking-wider text-[#606C38]">DOTS Adherence</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="relative bg-white py-24 md:py-28 z-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center md:mb-20">
            <h2 className="landing-reveal-up text-3xl font-extrabold tracking-[-0.02em] text-[#2D3B1E]">Empowering Healthcare Providers</h2>
            <p className="landing-text-fade mt-3 text-lg font-medium text-[#2D3B1E]/70">Tools designed specifically for medical staff to optimize the TB-DOTS program.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card glass-card landing-reveal-up rounded-2xl p-8 space-y-4 transition-all duration-500 ease-in-out hover:-translate-y-1.5 hover:border-[#606C38]/30 border border-slate-100 bg-white shadow-sm hover:shadow-md">
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
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <h2 className="landing-reveal-up text-3xl font-extrabold tracking-[-0.02em] text-[#2D3B1E] md:text-4xl">The Clinical Workflow</h2>
            <p className="landing-text-fade mt-3 text-lg font-medium text-[#2D3B1E]/70">How TEREA bridges the gap between patient reporting and medical oversight.</p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-8 bottom-8 hidden w-px -translate-x-1/2 border-l-2 border-dashed border-[#606C38]/20 sm:block" aria-hidden="true" />
            
            <div className="grid gap-6 sm:grid-cols-2 relative z-10">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`step-card glass-card landing-reveal-up flex items-start gap-5 rounded-2xl p-6 transition-all duration-500 ease-in-out hover:-translate-y-1 hover:border-[#606C38]/30 bg-white border border-slate-100 shadow-sm hover:shadow-md ${i % 2 === 0 ? "sm:-translate-y-2" : "sm:translate-y-2"}`}
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
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-[#2D3B1E]/80">
              © 2026 TEREA. Municipality of Carmona.
            </p>
            <p className="text-xs font-medium text-[#2D3B1E]/50 mt-1 sm:mt-0.5">
              Powered by React, Supabase, and Flutter.
            </p>
          </div>
        
          <div className="flex items-center gap-4">
            <a 
              href={APK_DOWNLOAD_URL} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-[#606C38] hover:text-[#2D3B1E] transition-colors"
            >
              <Download className="h-4 w-4" />
              Download APK
            </a>
            
            <Button 
              className="btn-premium group h-10 rounded-xl border border-slate-200 bg-white shadow-sm px-5 font-bold text-[#2D3B1E] hover:bg-[#606C38] hover:text-white hover:border-[#606C38]"
              onClick={() => navigate("/login")}
            >
              Staff Portal <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}