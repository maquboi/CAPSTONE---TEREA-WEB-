import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom"; // <-- ADDED: For navigation
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientQueueTableProps {
  search: string;
  riskFilter: string;
  statusFilter: string;
}

// Define exactly what a Patient looks like so TypeScript doesn't crash
interface PatientProfile {
  full_name: string;
  risk_level: string;
  barangay: string;
  is_symptomatic: boolean;
  is_close_contact: boolean;
  is_vulnerable: boolean;
}

interface QueueItem {
  id: number;
  status: string;
  created_at: string;
  patient_id: string;
  profiles: PatientProfile | PatientProfile[];
}

export function PatientQueueTable({ search, riskFilter, statusFilter }: PatientQueueTableProps) {
  const { toast } = useToast();
  const navigate = useNavigate(); // <-- ADDED: Instantiate navigate
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          created_at,
          patient_id,
          profiles!fk_patient (
            full_name,
            risk_level,
            barangay,
            is_symptomatic,
            is_close_contact,
            is_vulnerable
          )
        `)
        .eq('doctor_id', user.id);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
        setQueue(data as any || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id: number, name: string, action: 'active' | 'declined') => {
    const { error } = await supabase.from('connections').update({ status: action }).eq('id', id);
    if (!error) {
      toast({ title: "Updated", description: `${name} is now ${action}.` });
      fetchQueue();
    }
  };

  const filteredQueue = queue.filter((item) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    const matchesSearch = !search || profile?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === "all" || profile?.risk_level?.toLowerCase() === riskFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || (item.status === 'active' ? 'for-followup' : item.status) === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <Card className="dashboard-surface rounded-2xl border-[#DDE5B6]">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#2D3B1E]">Active Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-[#DDE5B6] bg-[#F4F7F4]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#DDE5B6]/30">
                <TableHead>Patient Name</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Clinical Indicators</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredQueue.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No patients found.</TableCell></TableRow>
              ) : (
                filteredQueue.map((item) => {
                  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                  const isHighRisk = profile?.risk_level?.toLowerCase().includes('high');

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{profile?.full_name}</TableCell>
                      <TableCell>{profile?.barangay || "Carmona"}</TableCell>
                      <TableCell>
                        <Badge variant={isHighRisk ? "destructive" : "secondary"}>
                          {profile?.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {profile?.is_symptomatic && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px]">Symptomatic</Badge>
                          )}
                          {profile?.is_close_contact && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">Contact</Badge>
                          )}
                          {profile?.is_vulnerable && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">Vulnerable</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{item.status}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === 'pending' && (
                            <>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleAction(item.id, profile?.full_name, 'active')}><Check className="h-4 w-4" /></Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleAction(item.id, profile?.full_name, 'declined')}><X className="h-4 w-4" /></Button>
                            </>
                          )}
                          {/* UPDATED: Route now points to /doctor/patient-details/ instead of /doctor/patient/ */}
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/doctor/patient-details/${item.patient_id}`)}><Eye className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}