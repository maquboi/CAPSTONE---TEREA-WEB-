import { cn } from "@/lib/utils";

interface BarangayData {
  name: string;
  riskLevel: "high" | "medium" | "low";
  cases: number;
}

const mockBarangayData: BarangayData[] = [
  { name: "Brgy. Cabilang Baybay", riskLevel: "high", cases: 45 },
  { name: "Brgy. Maduya", riskLevel: "high", cases: 38 },
  { name: "Brgy. Poblacion", riskLevel: "medium", cases: 22 },
  { name: "Brgy. Mabuhay", riskLevel: "medium", cases: 18 },
  { name: "Brgy. Lantic", riskLevel: "low", cases: 8 },
  { name: "Brgy. Milagrosa", riskLevel: "low", cases: 5 },
];

export function HeatmapCard() {
  const getRiskColor = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "bg-[#606C38]/90";
      case "medium":
        return "bg-[#DDE5B6]/90";
      case "low":
        return "bg-[#8d9a5b]/90";
    }
  };

  const getRiskBg = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "bg-[#F4F7F4] border-[#DDE5B6]";
      case "medium":
        return "bg-[#FBFCF8] border-[#DDE5B6]";
      case "low":
        return "bg-[#F4F7F4] border-[#DDE5B6]";
    }
  };

  return (
    <div className="dashboard-surface rounded-2xl border border-[#DDE5B6] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#2D3B1E]">Carmona Risk Heatmap</h3>
          <p className="text-sm text-[#2D3B1E]/65">
            High-risk TB assessment areas by barangay
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#606C38]" />
            <span className="text-[#2D3B1E]/65">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#DDE5B6]" />
            <span className="text-[#2D3B1E]/65">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#8d9a5b]" />
            <span className="text-[#2D3B1E]/65">Low</span>
          </div>
        </div>
      </div>

      {/* Simplified map visualization */}
      <div className="relative mb-6 h-48 overflow-hidden rounded-xl border border-[#DDE5B6] bg-[linear-gradient(180deg,rgba(244,247,244,0.95),rgba(221,229,182,0.24))]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2 p-4">
            {mockBarangayData.slice(0, 6).map((brgy, i) => (
              <div
                key={brgy.name}
                className={cn(
                  "h-14 w-20 rounded-lg flex items-center justify-center",
                  "transition-transform hover:scale-105 cursor-pointer",
                  getRiskColor(brgy.riskLevel)
                )}
                title={`${brgy.name}: ${brgy.cases} cases`}
              >
                <span className="text-white text-xs font-medium">{brgy.cases}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-[#F4F7F4]/90 px-2 py-1 text-xs text-[#2D3B1E]/65">
          Carmona, Cavite
        </div>
      </div>

      {/* Barangay list */}
      <div className="space-y-2">
        {mockBarangayData.map((brgy) => (
          <div
            key={brgy.name}
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-[#DDE5B6]/25",
              getRiskBg(brgy.riskLevel)
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-2 w-2 rounded-full", getRiskColor(brgy.riskLevel))} />
              <span className="font-medium">{brgy.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {brgy.cases} high-risk cases
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
