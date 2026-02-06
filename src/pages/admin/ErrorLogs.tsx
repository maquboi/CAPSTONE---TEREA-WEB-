import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, AlertTriangle, AlertCircle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const errorLogs = [
  {
    id: 1,
    level: "error",
    message: "Database connection timeout",
    source: "PatientService",
    timestamp: "2026-02-06 09:15:00",
    count: 3,
  },
  {
    id: 2,
    level: "warning",
    message: "API rate limit approaching",
    source: "ExternalAPI",
    timestamp: "2026-02-06 08:45:00",
    count: 1,
  },
  {
    id: 3,
    level: "error",
    message: "Failed to sync patient data",
    source: "SyncService",
    timestamp: "2026-02-05 16:30:00",
    count: 5,
  },
  {
    id: 4,
    level: "info",
    message: "Scheduled backup completed",
    source: "BackupService",
    timestamp: "2026-02-05 02:00:00",
    count: 1,
  },
  {
    id: 5,
    level: "warning",
    message: "High memory usage detected",
    source: "SystemMonitor",
    timestamp: "2026-02-04 14:20:00",
    count: 2,
  },
];

const getLevelIcon = (level: string) => {
  switch (level) {
    case "error":
      return <AlertCircle className="h-4 w-4 text-status-danger" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-status-warning" />;
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
};

const getLevelBadge = (level: string) => {
  const variants: Record<string, string> = {
    error: "bg-status-danger text-white",
    warning: "bg-status-warning text-sidebar-foreground",
    info: "bg-primary text-primary-foreground",
  };
  return variants[level] || variants.info;
};

export default function ErrorLogs() {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Error Logs
          </h1>
          <p className="text-muted-foreground">
            Monitor system errors and warnings
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-danger/10">
                  <AlertCircle className="h-5 w-5 text-status-danger" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">8</p>
                  <p className="text-sm text-muted-foreground">Errors (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-warning/10">
                  <AlertTriangle className="h-5 w-5 text-status-warning" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">3</p>
                  <p className="text-sm text-muted-foreground">Warnings (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">12</p>
                  <p className="text-sm text-muted-foreground">Info (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Log Entries</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search logs..." className="pl-8" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getLevelIcon(log.level)}</TableCell>
                    <TableCell>
                      <Badge className={getLevelBadge(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.message}</TableCell>
                    <TableCell className="text-muted-foreground">{log.source}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.count}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
