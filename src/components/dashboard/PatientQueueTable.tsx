import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
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

export function PatientQueueTable({ search, riskFilter, statusFilter }: PatientQueueTableProps) {
  const { toast } = useToast();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("DEBUG: No user logged in");
        return;
      }

      // UPDATED QUERY: Uses '!fk_patient' to target the specific SQL constraint
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
            barangay
          )
        `)
        .eq('doctor_id', user.id);

      if (error) {
        console.error("DEBUG: Supabase Error:", error.message);
        toast({ 
          variant: "destructive" as any, 
          title: "DB Error", 
          description: error.message 
        });
      } else {
        setQueue(data || []);
      }
    } catch (err) {
      console.error("DEBUG: System Crash:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel('queue-update')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'connections' 
      }, () => fetchQueue())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAction = async (id: number, name: string, action: 'active' | 'declined') => {
    const { error } = await supabase.from('connections').update({ status: action }).eq('id', id);
    if (!error) {
      toast({ title: action === 'active' ? "Approved" : "Declined", description: `${name} updated.` });
      fetchQueue();
    }
  };

  const filteredQueue = queue.filter((item) => {
    // Handle both array and object responses safely
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    
    const matchesSearch = !search || 
      profile?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      profile?.barangay?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === "all" || 
      profile?.risk_level?.toLowerCase() === riskFilter.toLowerCase();
    
    const uiStatus = item.status === 'active' ? 'for-followup' : item.status; 
    const matchesStatus = statusFilter === "all" || uiStatus === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base font-semibold">Active Queue</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No requests found. (DB Records: {queue.length})
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((item) => {
                  const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{profile?.full_name || "Unknown Patient"}</TableCell>
                      <TableCell>{profile?.barangay || "Carmona"}</TableCell>
                      <TableCell>
                        <Badge variant={(profile?.risk_level === "High" ? "destructive" : "secondary") as any}>
                          {profile?.risk_level || "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell><span className="text-sm capitalize">{item.status}</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === 'pending' && (
                            <>
                              <Button size={"icon" as any} variant={"outline" as any} className="text-green-600" onClick={() => handleAction(item.id, profile?.full_name, 'active')}><Check className="h-4 w-4" /></Button>
                              <Button size={"icon" as any} variant={"outline" as any} className="text-red-600" onClick={() => handleAction(item.id, profile?.full_name, 'declined')}><X className="h-4 w-4" /></Button>
                            </>
                          )}
                          <Button size={"icon" as any} variant={"ghost" as any}><Eye className="h-4 w-4" /></Button>
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