import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const initialCategories = [
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
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addKeywordCategory, setAddKeywordCategory] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  const removeKeyword = (categoryName: string, keyword: string) => {
    setCategories(categories.map((cat) =>
      cat.category === categoryName
        ? { ...cat, keywords: cat.keywords.filter((k) => k !== keyword) }
        : cat
    ));
    toast({ title: "Keyword removed", description: `"${keyword}" removed from ${categoryName}.` });
  };

  const addKeyword = () => {
    if (!newKeyword.trim() || !addKeywordCategory) return;
    setCategories(categories.map((cat) =>
      cat.category === addKeywordCategory
        ? { ...cat, keywords: [...cat.keywords, newKeyword.trim()] }
        : cat
    ));
    toast({ title: "Keyword added", description: `"${newKeyword}" added to ${addKeywordCategory}.` });
    setNewKeyword("");
    setAddKeywordCategory(null);
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories([...categories, { category: newCategoryName.trim(), keywords: [] }]);
    toast({ title: "Category added", description: `"${newCategoryName}" category created.` });
    setNewCategoryName("");
    setAddCategoryOpen(false);
  };

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    keywords: search
      ? cat.keywords.filter((k) => k.toLowerCase().includes(search.toLowerCase()))
      : cat.keywords,
  })).filter((cat) => !search || cat.keywords.length > 0 || cat.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Keyword Manager</h1>
            <p className="text-muted-foreground">Manage AI detection keywords for TB-related symptoms</p>
          </div>
          <Button onClick={() => setAddCategoryOpen(true)}>
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
                <Input placeholder="Search keywords..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredCategories.map((cat) => (
            <Card key={cat.category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cat.category}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setAddKeywordCategory(cat.category); setNewKeyword(""); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cat.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1 pr-1">
                      {keyword}
                      <button className="ml-1 rounded-full p-0.5 hover:bg-muted" onClick={() => removeKeyword(cat.category, keyword)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {cat.keywords.length === 0 && (
                    <p className="text-sm text-muted-foreground">No keywords yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., Pain Symptoms" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
            <Button onClick={addCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Keyword Dialog */}
      <Dialog open={!!addKeywordCategory} onOpenChange={() => setAddKeywordCategory(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Keyword to {addKeywordCategory}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Keyword</Label>
              <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Enter keyword..." onKeyDown={(e) => e.key === "Enter" && addKeyword()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddKeywordCategory(null)}>Cancel</Button>
            <Button onClick={addKeyword}>Add Keyword</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
