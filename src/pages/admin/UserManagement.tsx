import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { createClient } from "@supabase/supabase-js"; // Needed for the Admin Client
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
import { Plus, Search, MoreHorizontal, FileDown, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Trash2, Eye, CheckCircle, XCircle, Upload, Users, Activity, ShieldAlert, Building, FileSpreadsheet } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

// Initialize Supabase Admin Client for user creation without logging out the Admin
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
  id_attachment_url?: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"doctors" | "patients">("doctors");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog States
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [reviewUser, setReviewUser] = useState<User | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  
  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Master New User State
  const [newUser, setNewUser] = useState({ 
    name: "", email: "", contact: "", barangay: "", clinic_code: "", license_number: "", age: "", gender: "" 
  });

  // Sorting, Filtering, and Pagination State
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
            id_attachment_url: d.id_attachment_url
          };
        });
        setUsers(mappedUsers);
      }
    } catch (error: any) {
      toast({ title: "Error fetching users", description: error.message, variant: "destructive" });
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

  // Stats Calculations
  const stats = useMemo(() => {
    return {
      totalDoctors: users.filter(u => u.role === 'doctor').length,
      pendingVerifications: users.filter(u => u.role === 'patient' && u.verification_status === 'Pending').length,
      highRiskPatients: users.filter(u => u.role === 'patient' && u.risk_level === 'High').length
    };
  }, [users]);

  const requestSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Selection Logic
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

  // Add User Logic
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.contact) {
      toast({ title: "Validation Error", description: "Name, Email, and Contact are required.", variant: "destructive" });
      return;
    }
    if (activeTab === "patients" && (!newUser.age || !newUser.gender)) {
      toast({ title: "Validation Error", description: "Age and Gender are required for patients.", variant: "destructive" });
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

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("User creation failed, no data returned.");

      const profileData = {
        id: authData.user.id,
        full_name: newUser.name,
        email: newUser.email,
        role: userRole,
        contact_number: newUser.contact,
        ...(userRole === "doctor" && { clinic_code: newUser.clinic_code, barangay: newUser.barangay, license_number: newUser.license_number }),
        ...(userRole === "patient" && { age: parseInt(newUser.age), gender: newUser.gender, risk_level: "Pending", verification_status: "Verified" })
      };

      const { error: profileError } = await supabaseAdmin.from('profiles').insert([profileData]);

      if (profileError) throw new Error(profileError.message);

      toast({ title: "Success", description: `${userRole === 'doctor' ? 'Doctor' : 'Patient'} account created successfully.` });
      setAddDialogOpen(false);
      setNewUser({ name: "", email: "", contact: "", barangay: "", clinic_code: "", license_number: "", age: "", gender: "" });
      fetchUsers(); 

    } catch (error: any) {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
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
      toast({ title: "User updated", description: `${editingUser.name} has been updated in the database.` });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (authError) throw authError;

      setUsers(users.filter((u) => u.id !== user.id));
      toast({ title: "User Deleted", description: `${user.name} has been permanently removed.` });
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    const idsToDelete = Array.from(selectedUserIds);

    for (const id of idsToDelete) {
      try {
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
      toast({ title: "Bulk Delete Successful", description: `Successfully deleted ${successCount} users.` });
    } else {
      toast({ title: "Partial Deletion", description: `Deleted ${successCount} users. Failed to delete ${failCount} users.`, variant: "destructive" });
    }
  };

  const handleResetPassword = (user: User) => {
    toast({ title: "Password reset", description: `Password reset link logic pending for ${user.email}.` });
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

  // Bulk CSV Import Logic
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        // Basic CSV parsing
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        const headers = rows.shift()?.map(h => h.toLowerCase());

        if (!headers || headers.length < 2) throw new Error("Invalid CSV format. Ensure headers exist.");

        let success = 0;
        let failed = 0;
        toast({ title: "Importing Data", description: "Please wait while we process the CSV...", duration: 5000 });

        for (const row of rows) {
          if (row.length < 2 || !row[0]) continue; // Skip empty rows

          const getVal = (colName: string) => {
            const idx = headers.indexOf(colName);
            return idx >= 0 ? row[idx] : "";
          };

          const name = getVal("name") || getVal("full name");
          const email = getVal("email");
          const contact = getVal("contact") || getVal("phone");
          const roleInput = getVal("role")?.toLowerCase() || activeTab; // Use active tab if role column is missing
          const role = roleInput === "doctor" ? "doctor" : "patient";
          
          if (!name || !email) {
            failed++;
            continue;
          }

          // 1. Create Auth User
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: "TemporaryPassword123!",
            email_confirm: true,
          });

          if (authError || !authData.user) {
            failed++;
            continue;
          }

          // 2. Insert Profile
          const profileData = {
            id: authData.user.id,
            full_name: name,
            email: email,
            role: role,
            contact_number: contact,
            ...(role === "doctor" && { clinic_code: getVal("clinic_code"), barangay: getVal("barangay"), license_number: getVal("license_number") }),
            ...(role === "patient" && { risk_level: "Pending", verification_status: "Verified", barangay: getVal("barangay") })
          };

          const { error: profileError } = await supabaseAdmin.from('profiles').insert([profileData]);

          if (profileError) failed++; else success++;
        }

        toast({ 
          title: "Import Complete", 
          description: `Successfully imported ${success} users. ${failed > 0 ? `Failed to import ${failed} rows.` : ''}`,
          variant: failed > 0 ? "destructive" : "default"
        });
        fetchUsers();
      } catch (err: any) {
        toast({ title: "Import Error", description: err.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // PDF Export Logic
  const handleExportPDF = () => {
    if (processedData.length === 0) {
      toast({ title: "Export Failed", description: "No data available to export.", variant: "destructive" });
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
        rowText = `Name: ${u.name}   |   Contact: ${u.contact}   |   Risk: ${u.risk_level || "Pending"}   |   Barangay: ${u.barangay || "N/A"}`;
      }
      
      doc.text(rowText, 14, yPos);
      yPos += 8;
      doc.text("- - - -", 14, yPos);
      yPos += 10;
    });

    const safeDate = new Date().toLocaleDateString().replace(/\//g, '-');
    doc.save(`TEREA_${activeTab}_Registry_${safeDate}.pdf`);
    toast({ title: "Export Successful", description: "Your PDF has been generated." });
    setExportDialogOpen(false);
  };

  // ITIS-Compatible CSV Export Logic
  const handleExportCSV = () => {
    if (processedData.length === 0) {
      toast({ title: "Export Failed", description: "No data available to export.", variant: "destructive" });
      return;
    }

    let headers = [];
    if (activeTab === "doctors") {
      headers = ["ID", "Full_Name", "Email", "Contact_No", "Clinic_Code", "License_Number"];
    } else {
      // ITIS Benchmark Headers
      headers = ["ITIS_ID", "Full_Name", "Email", "Age", "Sex", "Contact_No", "Address_Barangay", "Risk_Classification", "Verification_Status"];
    }

    const csvRows = [headers.join(",")];

    processedData.forEach(u => {
      if (activeTab === "doctors") {
        csvRows.push(`"${u.id}","${u.name}","${u.email}","${u.contact}","${u.clinic_code || ''}","${u.license_number || ''}"`);
      } else {
        csvRows.push(`"${u.id}","${u.name}","${u.email}","${u.age || ''}","${u.gender || ''}","${u.contact}","${u.barangay || ''}","${u.risk_level || 'Pending'}","${u.verification_status || 'Pending'}"`);
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

    toast({ title: "Export Successful", description: `Your CSV has been securely generated.` });
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
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">Manage healthcare staff and patient registry</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {selectedUserIds.size > 0 && (
              <Button 
                variant="destructive" 
                className="rounded-xl shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> 
                Delete Selected ({selectedUserIds.size})
              </Button>
            )}
            
            {/* Hidden Input for CSV Import */}
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
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => setExportDialogOpen(true)}
            >
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white">
              <Plus className="mr-2 h-4 w-4" /> Add {activeTab === 'doctors' ? 'Doctor' : 'Patient'}
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
              <p className="text-sm text-slate-500 font-medium">Total Doctors</p>
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
              <p className="text-sm text-slate-500 font-medium">Pending Verifications</p>
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
              <p className="text-sm text-slate-500 font-medium">High Risk Patients</p>
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
            Doctors & Staff
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "patients" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Patients
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              if (activeTab === "patients") {
                const sanitized = val.replace(/[0-9]/g, "");
                if (val !== sanitized) {
                  toast({ 
                    title: "Invalid Input", 
                    description: "Numbers are not allowed when searching patients.", 
                    className: "bg-white text-slate-900 font-sans shadow-lg rounded-xl border border-slate-200" 
                  });
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
                <SortableHeader label="Name" sortKey="name" />
                <TableHead className="font-semibold text-slate-800">Contact</TableHead>
                {activeTab === "doctors" ? (
                  <>
                    <SortableHeader label="Clinic Code" sortKey="clinic_code" />
                    <SortableHeader label="License No." sortKey="license_number" />
                  </>
                ) : (
                  <>
                    <TableHead className="font-semibold text-slate-800">Verification</TableHead>
                    <TableHead className="font-semibold text-slate-800 p-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 transition-colors px-4 py-3 h-full w-full">
                            {riskFilter === "All" ? "Risk Level" : `Risk: ${riskFilter}`}
                            <Filter className={`h-3 w-3 ${riskFilter !== "All" ? "text-[#606C38] fill-[#606C38]" : "text-slate-400"}`} />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40 rounded-xl border-slate-200 bg-white shadow-lg">
                          <DropdownMenuLabel className="text-xs text-slate-500">Filter by Risk</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setRiskFilter("All")} className="cursor-pointer font-medium text-slate-700">All Patients {riskFilter === "All" && <span className="ml-auto text-[#606C38]">✓</span>}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRiskFilter("High")} className="cursor-pointer text-red-700 font-medium">High Risk {riskFilter === "High" && <span className="ml-auto text-red-700">✓</span>}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRiskFilter("Medium")} className="cursor-pointer text-amber-700 font-medium">Medium Risk {riskFilter === "Medium" && <span className="ml-auto text-amber-700">✓</span>}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRiskFilter("Low")} className="cursor-pointer text-green-700 font-medium">Low Risk {riskFilter === "Low" && <span className="ml-auto text-green-700">✓</span>}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableHead>
                    <SortableHeader label="Barangay" sortKey="barangay" />
                  </>
                )}
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">Loading database...</TableCell></TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-slate-500">No {activeTab} found matching your criteria.</TableCell></TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={`hover:bg-slate-50 transition-colors ${selectedUserIds.has(user.id) ? 'bg-slate-50/80' : ''}`}
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
                            user.risk_level === 'High' ? 'bg-red-100 text-red-800' : 
                            user.risk_level === 'Medium' ? 'bg-amber-100 text-amber-800' :
                            user.risk_level === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {user.risk_level || "Pending"}
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
                              <Eye className="mr-2 h-4 w-4" /> View ID
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { setEditingUser({ ...user }); setEditDialogOpen(true); }} className="cursor-pointer font-medium text-slate-700">Edit details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)} className="cursor-pointer font-medium text-slate-700">Reset Password</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 cursor-pointer font-medium focus:text-red-700 focus:bg-red-50" onClick={() => handleDeleteUser(user)}>
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {!loading && processedData.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
              <div className="text-sm text-slate-500">
                Showing {processedData.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
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
            <DialogTitle className="text-xl font-bold text-slate-900">Add New {activeTab === 'doctors' ? 'Doctor/Staff' : 'Patient'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-700 font-semibold">Full Name</Label>
              <Input 
                className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                value={newUser.name} 
                onChange={(e) => {
                  const val = e.target.value;
                  const sanitized = val.replace(/[^a-zA-Z\sñÑ.-]/g, '');
                  if (val !== sanitized) {
                    toast({ 
                      title: "Invalid Input", 
                      description: "Only characters, spaces, and hyphens are allowed for names.", 
                      className: "bg-white text-slate-900 font-sans shadow-lg rounded-xl border border-slate-200" 
                    });
                  }
                  setNewUser({ ...newUser, name: sanitized });
                }} 
                placeholder="Juan Dela Cruz" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Email</Label>
              <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Contact Number</Label>
              <Input 
                className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                value={newUser.contact} 
                onChange={(e) => {
                  const val = e.target.value;
                  const onlyNumbers = val.replace(/[^0-9]/g, '');
                  if (val !== onlyNumbers) {
                    toast({ 
                      title: "Invalid Input", 
                      description: "Only numbers are allowed for contact details.", 
                      className: "bg-white text-slate-900 font-sans shadow-lg rounded-xl border border-slate-200" 
                    });
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
                  <Label className="text-slate-700 font-semibold">Clinic Code (Optional)</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.clinic_code} onChange={(e) => setNewUser({ ...newUser, clinic_code: e.target.value })} placeholder="CAR-001" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">License/PRC No. (Optional)</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.license_number} onChange={(e) => setNewUser({ ...newUser, license_number: e.target.value })} placeholder="0123456" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-semibold">Assigned Barangay (Optional)</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={newUser.barangay} onChange={(e) => setNewUser({ ...newUser, barangay: e.target.value })} placeholder="Mabuhay" />
                </div>
              </>
            )}

            {/* Patient Specific Fields */}
            {activeTab === 'patients' && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Age</Label>
                  <Input 
                    type="text" 
                    maxLength={3} 
                    className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                    value={newUser.age} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const onlyNumbers = val.replace(/[^0-9]/g, '');
                      if (val !== onlyNumbers) {
                        toast({ 
                          title: "Invalid Input", 
                          description: "Only numbers are allowed for age.", 
                          className: "bg-white text-slate-900 font-sans shadow-lg rounded-xl border border-slate-200" 
                        });
                      }
                      setNewUser({ ...newUser, age: onlyNumbers.slice(0, 3) });
                    }} 
                    placeholder="25" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Gender</Label>
                  <Select onValueChange={(value) => setNewUser({ ...newUser, gender: value })}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white text-slate-900 focus:ring-[#606C38]"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="Male" className="text-slate-700 font-medium">Male</SelectItem>
                      <SelectItem value="Female" className="text-slate-700 font-medium">Female</SelectItem>
                      <SelectItem value="Other" className="text-slate-700 font-medium">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isSubmitting} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</Button>
            <Button onClick={handleAddUser} disabled={isSubmitting} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white shadow-sm">
              {isSubmitting ? "Creating..." : `Add ${activeTab === 'doctors' ? 'Doctor' : 'Patient'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Details</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Full Name</Label>
                <Input 
                  className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                  value={editingUser.name} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const sanitized = val.replace(/[^a-zA-Z\sñÑ.-]/g, '');
                    if (val !== sanitized) {
                      toast({ 
                        title: "Invalid Input", 
                        description: "Only characters, spaces, and hyphens are allowed for names.", 
                        className: "bg-white text-slate-900 font-sans shadow-lg rounded-xl border border-slate-200" 
                      });
                    }
                    setEditingUser({ ...editingUser, name: sanitized });
                  }} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Contact Number</Label>
                <Input 
                  className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" 
                  value={editingUser.contact} 
                  maxLength={11} 
                  onChange={(e) => {
                    const val = e.target.value;
                    const onlyNumbers = val.replace(/[^0-9]/g, '');
                    if (val !== onlyNumbers) {
                      toast({ 
                        title: "Invalid Input", 
                        description: "Only numbers are allowed for contact details.", 
                        className: "bg-white text-slate-900 font-sans shadow-lg rounded-xl border border-slate-200" 
                      });
                    }
                    setEditingUser({ ...editingUser, contact: onlyNumbers.slice(0, 11) });
                  }} 
                />
              </div>
              {editingUser.role === 'doctor' && (
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">License/PRC No.</Label>
                  <Input className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#606C38] text-slate-900" value={editingUser.license_number || ''} onChange={(e) => setEditingUser({ ...editingUser, license_number: e.target.value })} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</Button>
            <Button onClick={handleEditUser} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white shadow-sm">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Bulk Deletion
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Are you sure you want to permanently delete <strong>{selectedUserIds.size}</strong> selected users? This action cannot be undone and will remove all their associated data from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isSubmitting} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isSubmitting} className="rounded-xl shadow-sm">
              {isSubmitting ? "Deleting..." : "Yes, delete them"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Identity Viewer Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[500px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Proof of Identity</DialogTitle>
            <DialogDescription className="text-slate-500">Viewing registration documents for {reviewUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center">
            {proofUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center">
                <img src={proofUrl} alt="Proof of Residence" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-full aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <Eye className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No image uploaded</p>
              </div>
            )}
            <div className="mt-4 w-full grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <Label className="text-slate-500 block mb-1">Full Name</Label>
                  <span className="font-bold text-slate-900">{reviewUser?.name}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <Label className="text-slate-500 block mb-1">Barangay</Label>
                  <span className="font-bold text-slate-900">{reviewUser?.barangay || "N/A"}</span>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setVerifyDialogOpen(false)} className="rounded-xl bg-[#606C38] hover:bg-[#2D3B1E] text-white shadow-sm w-full sm:w-auto">
              Close Viewer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Options Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[400px] bg-white border-slate-200 shadow-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Export Registry Data</DialogTitle>
            <DialogDescription className="text-slate-500">
              Select the format you wish to export the current {activeTab} list to.
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
                <span>Standard PDF Document</span>
                <span className="text-xs text-slate-400 font-normal">Best for printing and visual reporting</span>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet className="mr-3 h-5 w-5 text-emerald-600" />
              <div className="flex flex-col items-start">
                <span>ITIS-Compatible CSV</span>
                <span className="text-xs text-slate-400 font-normal">Raw data formatted for DOH alignment</span>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setExportDialogOpen(false)} className="rounded-xl text-slate-500 hover:text-slate-700">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}