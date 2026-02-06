import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Heatmap from "./pages/admin/Heatmap";
import UserManagement from "./pages/admin/UserManagement";
import KeywordManager from "./pages/admin/KeywordManager";
import FAQsManagement from "./pages/admin/FAQsManagement";
import SystemReports from "./pages/admin/SystemReports";
import AuditLogs from "./pages/admin/AuditLogs";
import ErrorLogs from "./pages/admin/ErrorLogs";
import AdminProfile from "./pages/admin/Profile";
import AdminSettings from "./pages/admin/Settings";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import PatientQueue from "./pages/doctor/PatientQueue";
import AllPatients from "./pages/doctor/AllPatients";
import FollowUpTracker from "./pages/doctor/FollowUpTracker";
import Appointments from "./pages/doctor/Appointments";
import ActivityLogs from "./pages/doctor/ActivityLogs";
import DoctorProfile from "./pages/doctor/Profile";
import DoctorSettings from "./pages/doctor/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/heatmap" element={<Heatmap />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/keywords" element={<KeywordManager />} />
          <Route path="/admin/faqs" element={<FAQsManagement />} />
          <Route path="/admin/reports" element={<SystemReports />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/error-logs" element={<ErrorLogs />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          
          {/* Doctor routes */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/queue" element={<PatientQueue />} />
          <Route path="/doctor/patients" element={<AllPatients />} />
          <Route path="/doctor/follow-ups" element={<FollowUpTracker />} />
          <Route path="/doctor/appointments" element={<Appointments />} />
          <Route path="/doctor/activity" element={<ActivityLogs />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
          <Route path="/doctor/settings" element={<DoctorSettings />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
