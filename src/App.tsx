import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Global Contexts
import { LanguageProvider } from "./pages/admin/LanguageContext";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ResetPassword from "./pages/admin/ResetPassword";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import SystemReports from "./pages/admin/SystemReports";
import AuditLogs from "./pages/admin/AuditLogs";
import ErrorLogs from "./pages/admin/ErrorLogs";
import AdminProfile from "./pages/admin/Profile";
import AdminSettings from "./pages/admin/Settings";
import ITSupport from "./pages/admin/ITSupport";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import AllPatients from "./pages/doctor/AllPatients";
import PatientTracker from "./pages/doctor/PatientTracker"; 
import FollowUpTracker from "./pages/doctor/FollowUpTracker";
import Appointments from "./pages/doctor/Appointments";
import ActivityLogs from "./pages/doctor/ActivityLogs";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorSettings from "./pages/doctor/Settings";
import PatientDetail from "./pages/doctor/PatientDetail"; 

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/reports" element={<SystemReports />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/error-logs" element={<ErrorLogs />} />
            <Route path="/admin/support-tickets" element={<ITSupport />} /> 
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* Doctor routes */}
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/patients" element={<AllPatients />} />
            <Route path="/doctor/tracker" element={<PatientTracker />} />
            <Route path="/doctor/follow-ups" element={<FollowUpTracker />} />
            <Route path="/doctor/appointments" element={<Appointments />} />
            <Route path="/doctor/activity" element={<ActivityLogs />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/settings" element={<DoctorSettings />} />
            <Route path="/doctor/patient-details/:id" element={<PatientDetail />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;