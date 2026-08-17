import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js"; 
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, MoreHorizontal, FileDown, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Trash2, Eye, CheckCircle, XCircle, Upload, Users, Activity, ShieldAlert, Building, FileSpreadsheet, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import { useLanguage } from "./LanguageContext";

const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

interface User {
  id: string;
  name: string;
  email: string;
  role: "doctor" | "patient" | "admin";
  contact: string;
  clinic_code?: string;
  license_number?: string;
  risk_level?: "High" | "Medium" | "Low" | "Pending";
  barangay?: string;
  age?: number;
  gender?: string;
  verification_status?: "Pending" | "Verified" | "Rejected";
  treatment_status?: string;
  id_attachment_url?: string;
}

const generateClinicCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letters = Array.from({ length: 3 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const digits = Math.floor(100 + Math.random() * 900);
  return `${letters}-${digits}`;
};

export default function UserManagement() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"doctors" | "patients">("doctors");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [alert, setAlert] = useState({ open: false, title: "", message: "", type: "success" as "success" | "error" });
  const triggerAlert = (title: string, message: string, type: "success" | "error" = "success") => {
    setAlert({ open: true, title, message, type });
  };

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [newUser, setNewUser] = useState({ 
    name: "", email: "", contact: "", barangay: "", clinic_code: "", license_number: "", age: "", gender: "" 
  });

  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUserIds(new Set()); 
    setNewUser({ name: "", email: "", contact: "", barangay: "", clinic_code: "", license_number: "", age: "", gender: "" });
  }, [activeTab, search, riskFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedUsers: User[] = data.map((d: any) => {
          let normalizedRisk = "Pending";
          if (d.risk_level) {
            const lowerRisk = d.risk_level.toLowerCase();
            if (lowerRisk.includes("high")) normalizedRisk = "High";
            else if (lowerRisk.includes("medium")) normalizedRisk = "Medium";
            else if (lowerRisk.includes("low")) normalizedRisk = "Low";
          }
          return {
            id: d.id,
            name: d.full_name || 'Unknown',
            email: d.email || '',
            role: d.role as "doctor" | "patient" | "admin",
            contact: d.contact_number || 'N/A',
            clinic_code: d.clinic_code,
            license_number: d.license_number,
            risk_level: normalizedRisk as any,
            barangay: d.barangay,
            age: d.age,
            gender: d.gender,
            verification_status: d.verification_status || "Pending",
            treatment_status: d.status,
            id_attachment_url: d.id_attachment_url
          };
        });
        setUsers(mappedUsers);
      }
    } catch (error: any) {
      triggerAlert(t("error") || "Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo(() => {
    let filtered = users.filter(
      (u) =>
        u.role === (activeTab === "doctors" ? "doctor" : "patient") &&
        (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
    );

    if (activeTab === "patients" && riskFilter !== "All") {
      filtered = filtered.filter(u => u.risk_level === riskFilter);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, activeTab, search, sortConfig, riskFilter]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedUsers = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    return {
      totalDoctors: users.filter(u => u.role === 'doctor').length,
      pendingVerifications: users.filter(u => u.role === 'patient' && u.verification_status === 'Pending').length,
      highRiskPatients: users.filter(u => u.role === 'patient' && u.risk_level === 'High' && u.treatment_status !== 'cured' && u.treatment_status !== 'treatment_completed').length
    };
  }, [users]);

  const requestSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedUserIds.size === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      const newSelected = new Set(selectedUserIds);
      paginatedUsers.forEach(user => newSelected.add(user.id));
      setSelectedUserIds(newSelected);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.contact) {
      triggerAlert(t("error"), "Name, Email, and Contact are required.", "error");
      return;
    }
    if (activeTab === "patients" && (!newUser.age || !newUser.gender)) {
      triggerAlert(t("error"), "Age and Gender are required for patients.", "error");
      return;
    }

    setIsSubmitting(true);
    const userRole = activeTab === "doctors" ? "doctor" : "patient";
    const defaultPassword = "TemporaryPassword123!";

    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newUser.email,
        password: defaultPassword,
        email_confirm: true,
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("User already exists")) {
            throw new Error("This email is already registered. Please use a unique email.");
        }
        throw new Error(authError.message);
      }
      if (!authData.user) throw new Error("User creation failed, no data returned.");

      const profileData = {
        id: authData.user.id,
        full_name: newUser.name,
        email: newUser.email,
        role: userRole,
        contact_number: newUser.contact,
        ...(userRole === "doctor" && { 
            clinic_code: newUser.clinic_code || generateClinicCode(), 
            barangay: newUser.barangay, 
            license_number: newUser.license_number 
        }),
        ...(userRole === "patient" && { age: parseInt(newUser.age), gender: newUser.gender, risk_level: "Pending" })
      };

      const { error: profileError } = await supabaseAdmin.from('profiles').insert([profileData]);

      if (profileError) throw new Error(profileError.message);

      triggerAlert("Success", `${userRole === 'doctor' ? 'Doctor' : 'Patient'} account created successfully.`);
      setAddDialogOpen(false);
      setNewUser({ name: "", email: "", contact: "", barangay: "", clinic_code: "", license_number: "", age: "", gender: "" });
      fetchUsers(); 

    } catch (error: any) {
      triggerAlert(t("error"), error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editingUser.name, 
          contact_number: editingUser.contact,
          ...(editingUser.role === 'doctor' && { license_number: editingUser.license_number })
        })
        .eq('id', editingUser.id);
      if (error) throw error;
      setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
      setEditDialogOpen(false);
      triggerAlert("User updated", `${editingUser.name} has been updated in the database.`);
    } catch (error: any) {
      triggerAlert(t("error"), error.message, "error");
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      setIsSubmitting(true);

      if (user.id_attachment_url) {
        try {
          const urlParts = user.id_attachment_url.split('/public/');
          if (urlParts.length === 2) {
            const bucketAndPath = urlParts[1];
            const firstSlashIndex = bucketAndPath.indexOf('/');
            const bucketName = bucketAndPath.substring(0, firstSlashIndex);
            const filePath = bucketAndPath.substring(firstSlashIndex + 1);
            
            await supabaseAdmin.storage.from(bucketName).remove([filePath]);
          }
        } catch (storageErr) {
          console.error("Failed to delete ID image:", storageErr);
        }
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) throw profileError;

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (authError) throw authError;

      setUsers(users.filter((u) => u.id !== user.id));
      triggerAlert(t("deleteUser"), `${user.name} has been permanently removed.`);
    } catch (error: any) {
      triggerAlert(t("error"), error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    const idsToDelete = Array.from(selectedUserIds);

    for (const id of idsToDelete) {
      try {
        const userToDelete = users.find(u => u.id === id);

        if (userToDelete && userToDelete.id_attachment_url) {
           try {
             const urlParts = userToDelete.id_attachment_url.split('/public/');
             if (urlParts.length === 2) {
               const bucketAndPath = urlParts[1];
               const firstSlashIndex = bucketAndPath.indexOf('/');
               const bucketName = bucketAndPath.substring(0, firstSlashIndex);
               const filePath = bucketAndPath.substring(firstSlashIndex + 1);
               await supabaseAdmin.storage.from(bucketName).remove([filePath]);
             }
           } catch (err) {
             console.error("Failed to delete storage file:", err);
           }
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', id);
          
        if (profileError) throw profileError;

        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;
        
        successCount++;
      } catch (error) {
        console.error(`Failed to delete user ${id}:`, error);
        failCount++;
      }
    }

    setUsers(users.filter(u => !selectedUserIds.has(u.id)));
    setSelectedUserIds(new Set());
    setBulkDeleteDialogOpen(false);
    setIsSubmitting(false);

    if (failCount === 0) {
      triggerAlert("Bulk Delete Successful", `Successfully deleted ${successCount} users.`);
    } else {
      triggerAlert("Partial Deletion", `Deleted ${successCount} users. Failed to delete ${failCount} users.`, "error");
    }
  };

  const handleResetPassword = (user: User) => {
    triggerAlert(t("resetPassword"), `Password reset link logic pending for ${user.email}.`);
  };

  const handleReviewID = async (user: User) => {
    setReviewUser(user);
    if (user.id_attachment_url) {
      setProofUrl(user.id_attachment_url);
    } else {
      setProofUrl(null);
    }
    setVerifyDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        const headers = rows.shift()?.map(h => h.toLowerCase());

        if (!headers || headers.length < 2) throw new Error("Invalid CSV format. Ensure headers exist.");

        let success = 0;
        let failed = 0;
        triggerAlert("Importing Data", "Please wait while we process the CSV...", "success");

        for (const row of rows) {
          if (row.length < 2 || !row[0]) continue; 

          const getVal = (colName: string) => {
            const idx = headers.indexOf(colName);
            return idx >= 0 ? row[idx] : "";
          };

          const name = getVal("name") || getVal("full name");
          const email = getVal("email");
          const contact = getVal("contact") || getVal("phone");
          const roleInput = getVal("role")?.toLowerCase() || activeTab; 
          const role = roleInput === "doctor" ? "doctor" : "patient";
          
          if (!name || !email) {
            failed++;
            continue;
          }

          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: "TemporaryPassword123!",
            email_confirm: true,
          });

          if (authError || !authData.user) {
            failed++;
            continue;
          }

          const profileData = {
            id: authData.user.id,
            full_name: name,
            email: email,
            role: role,
            contact_number: contact,
            ...(role === "doctor" && { clinic_code: getVal("clinic_code") || generateClinicCode(), barangay: getVal("barangay"), license_number: getVal("license_number") }),
            ...(role === "patient" && { risk_level: "Pending", barangay: getVal("barangay") })
          };

          const { error: profileError } = await supabaseAdmin.from('profiles').insert([profileData]);

          if (profileError) failed++; else success++;
        }

        triggerAlert(
          "Import Complete", 
          `Successfully imported ${success} users. ${failed > 0 ? `Failed to import ${failed} rows.` : ''}`,
          failed > 0 ? "error" : "success"
        );
        fetchUsers();
      } catch (err: any) {
        triggerAlert(t("error"), err.message, "error");
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExportPDF = () => {
    if (processedData.length === 0) {
      triggerAlert(t("error"), "No data available to export.", "error");
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TEREA AI: Risk Assessment and Management Tracker System for Carmona", 14, yPos);
    yPos += 12;

    doc.setFontSize(12);
    const listTitle = activeTab === "doctors" ? "Doctor List:" : "Patient List:";
    doc.text(listTitle, 14, yPos);
    yPos += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    processedData.forEach((u) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      let rowText = "";
      if (activeTab === "doctors") {
        rowText = `Name: ${u.name}   |   Contact: ${u.contact}   |   Clinic: ${u.clinic_code || "N/A"}   |   License: ${u.license_number || "N/A"}`;
      } else {
        const isDischarged = u.treatment_status === 'cured' || u.treatment_status === 'treatment_completed';
        const displayRisk = isDischarged ? "Cleared" : u.risk_level;
        rowText = `Name: ${u.name}   |   Contact: ${u.contact}   |   Risk: ${displayRisk || "Pending"}   |   Barangay: ${u.barangay || "N/A"}`;
      }
      
      doc.text(rowText, 14, yPos);
      yPos += 8;
      doc.text("- - - -", 14, yPos);
      yPos += 10;
    });

    const safeDate = new Date().toLocaleDateString().replace(/\//g, '-');
    doc.save(`TEREA_${activeTab}_Registry_${safeDate}.pdf`);
    triggerAlert("Export Successful", "Your PDF has been generated.");
    setExportDialogOpen(false);
  };

  const handleExportCSV = () => {
    if (processedData.length === 0) {
      triggerAlert(t("error"), "No data available to export.", "error");
      return;
    }

    let headers = [];
    if (activeTab === "doctors") {
      headers = ["ID", "Full_Name", "Email", "Contact_No", "Clinic_Code", "License_Number"];
    } else {
      headers = ["ITIS_ID", "Full_Name", "Email", "Age", "Sex", "Contact_No", "Address_Barangay", "Risk_Classification", "Verification_Status"];
    }

    const csvRows = [headers.join(",")];

    processedData.forEach(u => {
      if (activeTab === "doctors") {
        csvRows.push(`"${u.id}","${u.name}","${u.email}","${u.contact}","${u.clinic_code || ''}","${u.license_number || ''}"`);
      } else {
        const isDischarged = u.treatment_status === 'cured' || u.treatment_status === 'treatment_completed';
        const displayRisk = isDischarged ? "Cleared" : u.risk_level;
        csvRows.push(`"${u.id}","${u.name}","${u.email}","${u.age || ''}","${u.gender || ''}","${u.contact}","${u.barangay || ''}","${displayRisk || 'Pending'}","${u.verification_status || 'Pending'}"`);
      }
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const safeDate = new Date().toLocaleDateString().replace(/\//g, '-');
    const fileName = activeTab === "patients" ? `ITIS_Patient_Registry_${safeDate}.csv` : `TEREA_Staff_Registry_${safeDate}.csv`;
    
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerAlert("Export Successful", "Your CSV has been securely generated.");
    setExportDialogOpen(false);
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: keyof User }) => (
    <TableHead 
      className="font-semibold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-slate-400" />
      </div>
    </TableHead>
  );

  return (
    <DashboardLayout role="admin" userName="Admin User">
      
      {/* Centralized Notification Pop-up */}
      <Dialog open={alert.open} onOpenChange={(open) => setAlert({...alert, open})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200 bg-white border-slate-200 shadow-xl font-sans">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${alert.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {alert.type === 'success' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{alert.title}</h2>
          <p className="text-slate-500 mt-2 text-sm">{alert.message}</p>
          <Button className="mt-6 w-full rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white" onClick={() => setAlert({...alert, open: false})}>{t("okay")}</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("userMgmtTitle")}</h1>
            <p className="text-sm text-slate-500">{t("userMgmtSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {selectedUserIds.size > 0 && (
              <Button 
                variant="destructive" 
                className="rounded-xl shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> 
                {t("deleteSelected")} ({selectedUserIds.size})
              </Button>
            )}
            
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Upload className="mr-2 h-4 w-4" /> {t("importCsv")}
            </Button>
            
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => setExportDialogOpen(true)}
            >
              <FileDown className="mr-2 h-4 w-4" /> {t("export")}
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white">
              <Plus className="mr-2 h-4 w-4" /> {activeTab === 'doctors' ? t("addDoctor") : t("addPatient")}
            </Button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <div 
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              setActiveTab("doctors");
              setRiskFilter("All");
              setSearch("");
            }}
          >
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t("totalDoctorsTitle")}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalDoctors}</h3>
            </div>
          </div>
          
          <div 
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              setActiveTab("patients");
              setRiskFilter("All");
              setSearch("");
            }}
          >
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t("pendingVerificationsTitle")}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.pendingVerifications}</h3>
            </div>
          </div>

          <div 
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => {
              setActiveTab("patients");
              setRiskFilter("High");
              setSearch("");
            }}
          >
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t("highRiskPatientsTitle")}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.highRiskPatients}</h3>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("doctors")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "doctors" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("doctorsAndStaffTab")}
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "patients" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("patientsTab")}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={activeTab === "doctors" ? t("searchDoctors") : t("searchPatients")}
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              if (activeTab === "patients") {
                const sanitized = val.replace(/[0-9]/g, "");
                if (val !== sanitized) {
                  triggerAlert("Invalid Input", "Numbers are not allowed when searching patients.", "error");
                }
                setSearch(sanitized);
              } else {
                setSearch(val);
              }
            }}
            className="pl-10 bg-white border-slate-200 rounded-xl h-11 focus-visible:ring-[#606C38]"
          />
        </div>

        {/* Table View */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox 
                    checked={paginatedUsers.length > 0 && selectedUserIds.size === paginatedUsers.length}
                    onCheckedChange={toggleAllSelection}
                    aria-label="Select all"
                    className="data-[state=checked]:bg-[#606C38] data-[state=checked]:border-[#606C38]"
                  />
                </TableHead>
                <SortableHeader label={t("nameCol")} sortKey="name" />
                <TableHead className="font-semibold text-slate-800">{t("contactCol")}</TableHead>
                {activeTab === "doctors" ? (
                  <>
                    <SortableHeader label={t("clinicCodeCol")} sortKey="clinic_code" />
                    <SortableHeader label={t("licenseNoCol")} sortKey="license_number" />
                  </>
                ) : (
                  <>
                    <TableHead className="font-semibold text-slate-800">{t("verificationCol")}</TableHead>
                    <TableHead className="font-semibold text-slate-800 p-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 transition-colors px-4 py-3 h-full w-full">
                            {riskFilter === "All" ? t("riskLevelCol") : `Risk: ${riskFilter === "High" ? t("highRiskFilter") : riskFilter === "Medium" ? t("mediumRiskFilter") : t("lowRiskFilter")}`}
                            <Filter className={`h-3 w-3 ${riskFilter !== "All" ? "text-[#606C38] fill-[#606C38]" : "text-slate-400"}`} />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40 rounded-xl border-slate-200 bg-white shadow-lg">
                          <DropdownMenuLabel className="text-xs text-slate-500">{t("filterByRisk")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setRiskFilter("All")} className="cursor-pointer font-medium text-slate-700">{t("allPatientsFilter")} {riskFilter === "All" && <span className="ml-auto text-[#606C38]">✓</span>}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRiskFilter("High")} className="cursor-pointer text-red-700 font-medium">{t("highRiskFilter")} {riskFilter === "High" && <span className="ml-auto text-red-700">✓</span>}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRiskFilter("Medium")} className="cursor-pointer text-amber-700 font-medium">{t("mediumRiskFilter")} {riskFilter === "Medium" && <span className="ml-auto text-amber-700">✓</span>}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRiskFilter("Low")} className="cursor-pointer text-green-700 font-medium">{t("lowRiskFilter")} {riskFilter === "Low" && <span className="ml-auto text-green-700">✓</span>}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableHead>
                    <SortableHeader label={t("barangayCol")} sortKey="barangay" />
                  </>
                )}
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">{t("loadingDatabase")}</TableCell></TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">{t("noUsersFound")}</TableCell></TableRow>
              ) : (
                paginatedUsers.map((user) => {
                  const isDischarged = user.role === 'patient' && (user.treatment_status === 'cured' || user.treatment_status === 'treatment_completed');
                  const displayRisk = isDischarged ? "Cleared" : user.risk_level;

                  return (
                    <TableRow 
                      key={user.id} 
                      className={`hover:bg-slate-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-slate-50/80' : ''} ${isDischarged ? 'opacity-60 bg-slate-50/50 grayscale-[0.2]' : ''}`}
                    >
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          aria-label={`Select ${user.name}`}
                          className="data-[state=checked]:bg-[#606C38] data-[state=checked]:border-[#606C38]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">{user.contact}</TableCell>
                      
                      {activeTab === "doctors" ? (
                        <>
                          <TableCell className="text-slate-600">{user.clinic_code || "N/A"}</TableCell>
                          <TableCell className="text-slate-600 font-medium">{user.license_number || "N/A"}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.verification_status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 
                              user.verification_status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {user.verification_status || "Pending"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              displayRisk === 'Cleared' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                              displayRisk === 'High' ? 'bg-red-100 text-red-800' : 
                              displayRisk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                              displayRisk === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {displayRisk === 'Cleared' ? 'Cleared' : displayRisk === 'High' ? t("highRiskFilter") : displayRisk === 'Medium' ? t("mediumRiskFilter") : displayRisk === 'Low' ? t("lowRiskFilter") : "Pending"}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-600">{user.barangay || "N/A"}</TableCell>
                        </>
                      )}

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-200 bg-white shadow-lg">
                            {activeTab === "patients" && (
                              <DropdownMenuItem onClick={() => handleReviewID(user)} className="cursor-pointer font-medium text-blue-600">
                                <Eye className="mr-2 h-4 w-4" /> {t("viewId")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => { setEditingUser({ ...user }); setEditDialogOpen(true); }} className="cursor-pointer font-medium text-slate-700">{t("editDetails")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)} className="cursor-pointer font-medium text-slate-700">{t("resetPassword")}</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 cursor-pointer font-medium focus:text-red-700 focus:bg-red-50" onClick={() => handleDeleteUser(user)}>
                              {t("deleteUser")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
            
          {/* Pagination Controls */}
          {!loading && processedData.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
              <div className="text-sm text-slate-500">
                {t("showing")} {processedData.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} {t("to")} {Math.min(currentPage * itemsPerPage, processedData.length)} {t("of")} {processedData.length} {t("entries")}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Master Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] md:max-w-[600px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">{activeTab === 'doctors' ? t("addNewDoctor") : t("addNewPatient")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-700 font-semibold">{t("fullNameLabel")}</Label>
              <Input 
                className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                value={newUser.name} 
                onChange={(e) => {
                  const val = e.target.value;
                  const sanitized = val.replace(/[^a-zA-Z\sñÑ.-]/g, '');
                  if (val !== sanitized) {
                    triggerAlert("Invalid Input", "Only characters, spaces, and hyphens are allowed for names.", "error");
                  }
                  setNewUser({ ...newUser, name: sanitized });
                }} 
                placeholder="Juan Dela Cruz" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">{t("emailLabel")}</Label>
              <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">{t("contactNumberLabel")}</Label>
              <Input 
                className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                value={newUser.contact} 
                onChange={(e) => {
                  const val = e.target.value;
                  const onlyNumbers = val.replace(/[^0-9]/g, '');
                  if (val !== onlyNumbers) {
                    triggerAlert("Invalid Input", "Only numbers are allowed for contact details.", "error");
                  }
                  setNewUser({ ...newUser, contact: onlyNumbers.slice(0, 11) });
                }} 
                maxLength={11} 
                placeholder="09XXXXXXXXX" 
              />
            </div>

            {/* Doctor Specific Fields */}
            {activeTab === 'doctors' && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t("clinicCodeOptional")}</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.clinic_code} onChange={(e) => setNewUser({ ...newUser, clinic_code: e.target.value })} placeholder="Leave blank to auto-generate" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t("licenseOptional")}</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.license_number} onChange={(e) => setNewUser({ ...newUser, license_number: e.target.value })} placeholder="0123456" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-semibold">{t("barangayOptional")}</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.barangay} onChange={(e) => setNewUser({ ...newUser, barangay: e.target.value })} placeholder="Mabuhay" />
                </div>
              </>
            )}

            {/* Patient Specific Fields */}
            {activeTab === 'patients' && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t("ageLabel")}</Label>
                  <Input 
                    type="text" 
                    maxLength={3} 
                    className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                    value={newUser.age} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const onlyNumbers = val.replace(/[^0-9]/g, '');
                      if (val !== onlyNumbers) {
                        triggerAlert("Invalid Input", "Only numbers are allowed for age.", "error");
                      }
                      setNewUser({ ...newUser, age: onlyNumbers.slice(0, 3) });
                    }} 
                    placeholder="25" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t("genderLabel")}</Label>
                  <Select onValueChange={(value) => setNewUser({ ...newUser, gender: value })}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-[#606C38]"><SelectValue placeholder={t("selectGender")} /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="Male" className="text-slate-700 font-medium">{t("male")}</SelectItem>
                      <SelectItem value="Female" className="text-slate-700 font-medium">{t("female")}</SelectItem>
                      <SelectItem value="Other" className="text-slate-700 font-medium">{t("other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isSubmitting} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">{t("cancel")}</Button>
            <Button onClick={handleAddUser} disabled={isSubmitting} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white shadow-sm">
              {isSubmitting ? t("creating") : activeTab === 'doctors' ? t("addDoctor") : t("addPatient")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">{t("editDetailsTitle")}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{t("fullNameLabel")}</Label>
                <Input 
                  className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                  value={editingUser.name} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const sanitized = val.replace(/[^a-zA-Z\sñÑ.-]/g, '');
                    if (val !== sanitized) {
                      triggerAlert("Invalid Input", "Only characters, spaces, and hyphens are allowed for names.", "error");
                    }
                    setEditingUser({ ...editingUser, name: sanitized });
                  }} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">{t("contactNumberLabel")}</Label>
                <Input 
                  className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                  value={editingUser.contact} 
                  maxLength={11} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const onlyNumbers = val.replace(/[^0-9]/g, '');
                    if (val !== onlyNumbers) {
                      triggerAlert("Invalid Input", "Only numbers are allowed for contact details.", "error");
                    }
                    setEditingUser({ ...editingUser, contact: onlyNumbers.slice(0, 11) });
                  }} 
                />
              </div>
              {editingUser.role === 'doctor' && (
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{t("licenseOptional")}</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={editingUser.license_number || ''} onChange={(e) => setEditingUser({ ...editingUser, license_number: e.target.value })} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">{t("cancel")}</Button>
            <Button onClick={handleEditUser} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white shadow-sm">{t("saveChanges")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {t("confirmBulkDeletion")}
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              {t("bulkDeleteUserWarning")} <strong>{selectedUserIds.size}</strong> {t("bulkDeleteUserWarning2")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isSubmitting} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isSubmitting} className="rounded-xl shadow-sm">
              {isSubmitting ? t("deleting") : t("yesDeleteThem")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Identity Viewer Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[500px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">{t("proofOfIdentity")}</DialogTitle>
            <DialogDescription className="text-slate-500">{t("viewingDocsFor")} {reviewUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            {proofUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center">
                <img src={proofUrl} alt="Proof of Residence" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-full aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <Eye className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">{t("noImageUploaded")}</p>
              </div>
            )}
            <div className="mt-4 w-full grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <Label className="text-slate-500 block mb-1">{t("fullNameLabel")}</Label>
                  <span className="font-bold text-slate-900">{reviewUser?.name}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <Label className="text-slate-500 block mb-1">{t("barangayCol")}</Label>
                  <span className="font-bold text-slate-900">{reviewUser?.barangay || "N/A"}</span>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setVerifyDialogOpen(false)} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white shadow-sm w-full sm:w-auto">
              {t("closeViewer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Options Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">{t("exportRegistryData")}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {t("exportFormatDesc")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
              onClick={handleExportPDF}
            >
              <FileDown className="mr-3 h-5 w-5 text-red-500" />
              <div className="flex flex-col items-start">
                <span>{t("standardPdfDoc")}</span>
                <span className="text-xs text-slate-400 font-normal">{t("pdfDesc")}</span>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="mr-3 h-5 w-5 text-emerald-600" />
              <div className="flex flex-col items-start">
                <span>{t("itisCsvDoc")}</span>
                <span className="text-xs text-slate-400 font-normal">{t("csvDesc")}</span>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setExportDialogOpen(false)} className="rounded-xl text-slate-500 hover:text-slate-700">
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}