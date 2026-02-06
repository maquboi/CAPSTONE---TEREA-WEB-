import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const riskLegend = [
  { level: "Critical", color: "bg-status-danger", count: 2 },
  { level: "High", color: "bg-status-warning", count: 5 },
  { level: "Moderate", color: "bg-primary", count: 8 },
  { level: "Low", color: "bg-status-success", count: 12 },
];

export default function Heatmap() {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Risk Heatmap
          </h1>
          <p className="text-muted-foreground">
            Geographic distribution of TB risk assessments across Carmona barangays
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <HeatmapCard />
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Risk Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskLegend.map((item) => (
                  <div key={item.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded ${item.color}`} />
                      <span className="text-sm">{item.level}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Barangays</span>
                  <span className="font-medium">27</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Cases</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High-Risk Areas</span>
                  <span className="font-medium text-status-danger">7</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
