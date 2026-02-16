import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Filter } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const auditLogs = [
  { id: 1, action: "User Created", user: "Admin Jose Rizal", target: "Dr. Maria Santos", timestamp: "2026-02-06 09:15:00", category: "User Management" },
  { id: 2, action: "Keyword Added", user: "Admin Jose Rizal", target: "'ubo ng matagal'", timestamp: "2026-02-06 08:45:00", category: "Keywords" },
  { id: 3, action: "Report Generated", user: "Admin Jose Rizal", target: "January 2026 TB Report", timestamp: "2026-02-05 16:30:00", category: "Reports" },
  { id: 4, action: "Password Reset", user: "Admin Jose Rizal", target: "Dr. Juan Dela Cruz", timestamp: "2026-02-05 14:20:00", category: "User Management" },
  { id: 5, action: "FAQ Updated", user: "Admin Jose Rizal", target: "What is TB?", timestamp: "2026-02-05 11:00:00", category: "FAQs" },
];

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = auditLogs.filter((log) => {
    const matchesSearch = search === "" ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" ||
      (categoryFilter === "users" && log.category === "User Management") ||
      (categoryFilter === "keywords" && log.category === "Keywords") ||
      (categoryFilter === "reports" && log.category === "Reports") ||
      (categoryFilter === "faqs" && log.category === "FAQs");
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Track system actions and changes</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Activity History</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search logs..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="users">User Management</SelectItem>
                    <SelectItem value="keywords">Keywords</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                    <SelectItem value="faqs">FAQs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell className="text-muted-foreground">{log.target}</TableCell>
                    <TableCell><Badge variant="outline">{log.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{log.timestamp}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No logs found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
