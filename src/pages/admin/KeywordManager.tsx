import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search } from "lucide-react";

const keywordCategories = [
  {
    category: "Cough Symptoms",
    keywords: ["ubo", "cough", "masakit lalamunan", "dry cough", "may plema"],
  },
  {
    category: "Fever Symptoms",
    keywords: ["lagnat", "fever", "mainit", "nilalagnat", "high fever"],
  },
  {
    category: "Respiratory",
    keywords: ["hirap huminga", "shortness of breath", "nahihirapan huminga", "gasping"],
  },
  {
    category: "General TB Signs",
    keywords: ["payat", "weight loss", "pawis sa gabi", "night sweats", "pagod"],
  },
];

export default function KeywordManager() {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Keyword Manager
            </h1>
            <p className="text-muted-foreground">
              Manage AI detection keywords for TB-related symptoms
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Search Keywords</CardTitle>
                <CardDescription>Find and manage existing keywords</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search keywords..." className="pl-8" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {keywordCategories.map((cat) => (
            <Card key={cat.category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cat.category}</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cat.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {keyword}
                      <button className="ml-1 rounded-full p-0.5 hover:bg-muted">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
