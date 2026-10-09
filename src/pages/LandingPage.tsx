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
  BellRing,
  Activity,
  Download,
  Smartphone,
  Lock,
  QrCode,
  CheckCircle2,
  Building2,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const APK_DOWNLOAD_URL =
  "https://github.com/maquboi/CAPSTONE---TEREA-WEB-/releases/latest/download/TEREA.apk";

const features = [
  {
    icon: ClipboardCheck,
    title: "Clinical Risk Triage",
    description:
      "Automated evaluation protocol classifies reported symptoms to assist healthcare workers in prioritizing diagnostic consultations.",
  },
  {
    icon: LineChart,
    title: "Adherence & Compliance Tracking",
    description:
      "Monitor daily medication logs, follow-up checkup schedules, and treatment roadmaps in a centralized dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence-Based Protocols",
    description:
      "Designed following standard clinical tuberculosis management guidelines to support structured local documentation.",
  },
];

const steps = [
  {
    phase: "Phase 01",
    title: "Patient Self-Screening & Intake",
    desc: "Residents complete the clinical screening questionnaire and log daily medication doses through the mobile companion app.",
  },
  {
    phase: "Phase 02",
    title: "Clinical Risk Stratification",
    desc: "Triage algorithms evaluate reported indicators and flag priority cases directly to the health center's consultation queue.",
  },
  {
    phase: "Phase 03",
    title: "Clinician Verification & Enrollment",
    desc: "Healthcare workers review screening data, coordinate laboratory testing, and establish structured treatment roadmaps.",
  },
  {
    phase: "Phase 04",
    title: "6-Month Treatment Surveillance",
    desc: "The system logs patient daily adherence, scheduled follow-up milestones, and routine health progress records.",
  },
];

const carouselImages = [
  {
    url: "/CityHallCarmona.jpg",
    title: "Carmona City Hall & Executive Offices",
    subtitle: "Civic center and community health administration area",
  },
  {
    url: "/CarmonaPlace.jpg",
    title: "Carmona Health Center Facility",
    subtitle: "Primary consultation and diagnostic laboratory center",
  },
  {
    url: "/CarmonaStreets.jpg",
    title: "Community Outreach & Care",
    subtitle: "Healthcare worker and BHW outreach across participating Carmona communities",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    APK_DOWNLOAD_URL
  )}`;

  return (
    <div className="relative min-h-screen bg-[#F1F5F9] font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* QR Code Scan Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl p-6 text-center bg-white border-slate-300 shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-center">
              Scan to Install Mobile Companion
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 text-center mt-1">
              Scan with an Android device to download the official TEREA Patient Companion APK.
            </DialogDescription>
          </DialogHeader>

          <div className="my-5 flex flex-col items-center justify-center">
            <div className="p-3 bg-white border-2 border-slate-200 rounded-xl shadow-md">
              <img
                src={qrCodeUrl}
                alt="Scan to download TEREA APK"
                className="h-44 w-44 rounded-lg object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-teal-800 bg-teal-50 px-3 py-1 rounded-full text-xs font-semibold border border-teal-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
              <span>Direct GitHub Release CDN</span>
            </div>
          </div>

          <div className="space-y-2">
            <a
              href={APK_DOWNLOAD_URL}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <Download className="h-3.5 w-3.5" /> Direct Download (.apk)
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

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-3">
            <img
              src="/LogoNoBG.png"
              alt="TEREA Logo"
              className="h-9 w-9 object-contain drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                TEREA
              </span>
              <span className="text-[10px] font-semibold text-teal-700 tracking-wider uppercase mt-0.5">
                Carmona Health Center Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => setQrModalOpen(true)}
              className="hidden lg:flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold h-9 shadow-xs"
            >
              <QrCode className="h-3.5 w-3.5 text-teal-700" />
              Scan QR
            </Button>

            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 sm:px-4 py-2 rounded-xl transition-colors shadow-xs"
            >
              <Smartphone className="h-4 w-4 text-teal-700" />
              <span className="hidden sm:inline">Patient App (.apk)</span>
              <span className="sm:hidden">Get App</span>
            </a>

            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Clinician Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-14 sm:py-18 lg:py-20 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Content Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 border border-teal-200/90 rounded-full text-xs font-bold text-teal-800 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                Carmona Community Healthcare Partner
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Tuberculosis Clinical Care & Compliance Management System
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                TEREA supports healthcare providers and residents in Carmona with structured symptom triage, verified medication adherence tracking, and organized clinical treatment surveillance.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3.5">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 px-6 py-3.5 rounded-xl shadow-[0_10px_25px_-5px_rgba(15,118,110,0.4)] transition-all hover:shadow-[0_14px_30px_-5px_rgba(15,118,110,0.5)] hover:-translate-y-0.5"
                >
                  <Lock className="h-4 w-4" />
                  Access Clinician Portal
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>

                <Button
                  variant="outline"
                  onClick={() => setQrModalOpen(true)}
                  className="h-[50px] rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold gap-2 px-5 shadow-sm"
                >
                  <QrCode className="h-4 w-4 text-teal-700" />
                  Install Mobile Companion
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-3 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-teal-700" /> Local Community Focus
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-teal-700" /> Symptom Triage Protocol
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-700" /> Privacy & Healthcare Guidelines Aligned
                </span>
              </div>
            </div>

            {/* Right: Featured Carmona Civic Photo Card + Layered Console */}
            <div className="w-full space-y-5">
              {/* FEATURED JPG CARMONA SHOWCASE CARD */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-300/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                {/* Image Container with Smooth Fade */}
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
                  <img
                    key={carouselImages[currentImageIndex].url}
                    src={carouselImages[currentImageIndex].url}
                    alt={carouselImages[currentImageIndex].title}
                    className="h-full w-full object-cover transition-all duration-700 scale-100 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                  {/* Top Floating Badge */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[11px] font-bold text-slate-800 shadow-md">
                    <MapPin className="h-3 w-3 text-teal-700" />
                    <span>Carmona Pilot Implementation</span>
                  </div>

                  {/* Slide Navigation Buttons */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
                        )
                      }
                      className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                      title="Previous photo"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
                      }
                      className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                      title="Next photo"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Bottom Text Over Picture */}
                  <div className="absolute bottom-3.5 left-4 right-4">
                    <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow-sm">
                      {carouselImages[currentImageIndex].title}
                    </p>
                    <p className="text-slate-200 text-xs mt-0.5 drop-shadow-xs line-clamp-1">
                      {carouselImages[currentImageIndex].subtitle}
                    </p>
                  </div>
                </div>

                {/* Dot Indicators */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Area & Facility {currentImageIndex + 1} of {carouselImages.length}
                  </span>
                  <div className="flex items-center gap-2">
                    {carouselImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? "w-6 bg-teal-700"
                            : "w-2 bg-slate-300 hover:bg-slate-400"
                        }`}
                        title={`Go to view ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* GROUNDED CLINICAL CONSOLE SUMMARY (Thick Drop Shadow) */}
              <div className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-[0_15px_35px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">
                      Live Clinical Triage Queue
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Carmona Health Center
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3.5">
                  <div className="rounded-xl p-3 bg-slate-50 border border-slate-200 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Cohort Adherence
                    </p>
                    <p className="text-xl font-extrabold text-teal-700 mt-0.5">
                      94.2%
                    </p>
                    <span className="text-[10px] font-medium text-slate-500">
                      Active Monitored Cohort
                    </span>
                  </div>

                  <div className="rounded-xl p-3 bg-slate-50 border border-slate-200 shadow-2xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Presumptive Cases
                    </p>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      12 Flagged
                    </p>
                    <span className="text-[10px] font-medium text-teal-700">
                      For Clinical Consultation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Impact KPI Ribbon (Thick Contrast Shadow) */}
      <section className="py-8 bg-[#F1F5F9]">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-y-0 sm:divide-x border-2 border-slate-300/80 rounded-2xl bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl font-extrabold text-slate-900">Community Pilot</span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 mt-1">
                Carmona Local Implementation
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl font-extrabold text-slate-900">Automated</span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 mt-1">
                Clinical Symptom Triage
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl font-extrabold text-slate-900">6-Month Protocol</span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 mt-1">
                Standard Treatment Surveillance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section (High-Contrast Raised Cards) */}
      <section className="py-18 sm:py-22 bg-[#F1F5F9] border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Structured Clinical Workflow
            </h2>
            <p className="mt-2.5 text-base text-slate-600">
              Designed for healthcare professionals to coordinate and monitor tuberculosis care.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-7 bg-white border border-slate-300/80 shadow-[0_10px_25px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_35px_rgba(15,118,110,0.14)] hover:border-teal-300 transition-all space-y-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 border border-teal-200/90 shadow-2xs">
                  <f.icon className="h-6 w-6 text-teal-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step-by-Step Clinical Care Pathway */}
      <section className="py-18 sm:py-22 bg-white border-t border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              4-Phase Clinical Care Pathway
            </h2>
            <p className="mt-2.5 text-base text-slate-600">
              How TEREA connects patient mobile self-reporting with healthcare provider oversight.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 bg-slate-50 border border-slate-300/80 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:shadow-[0_14px_30px_rgba(15,23,42,0.1)] transition-all space-y-3 relative"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md inline-block">
                  {s.phase}
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Civic Footer */}
      <footer className="bg-slate-950 text-white py-12 border-t border-slate-800 shadow-2xl">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="text-lg font-extrabold tracking-tight text-white">TEREA</span>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs font-semibold text-slate-300">
                Carmona Healthcare Support System
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Clinical companion tool for tuberculosis patient care coordination and adherence monitoring.
            </p>
            <p className="text-[11px] text-slate-500">
              In adherence with data privacy standards and evidence-based public health principles.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" /> Download APK
            </a>

            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-600 px-4.5 py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(15,118,110,0.5)]"
            >
              Clinician Portal <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}