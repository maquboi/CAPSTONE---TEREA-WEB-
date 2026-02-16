import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const initialFaqs: FAQ[] = [
  { id: "1", question: "What is tuberculosis (TB)?", answer: "Tuberculosis is an infectious disease caused by bacteria that mainly affects the lungs. It spreads through the air when infected people cough or sneeze.", category: "General" },
  { id: "2", question: "What are the common symptoms of TB?", answer: "Common symptoms include persistent cough (more than 2 weeks), fever, night sweats, weight loss, fatigue, and coughing up blood.", category: "Symptoms" },
  { id: "3", question: "How is TB treated?", answer: "TB is treated with a combination of antibiotics taken for 6-9 months. It's crucial to complete the full course of treatment to prevent drug resistance.", category: "Treatment" },
  { id: "4", question: "Is TB contagious?", answer: "Yes, TB is contagious and spreads through airborne droplets. However, it typically requires prolonged close contact with an infected person.", category: "Prevention" },
  { id: "5", question: "How do I use the TEREA app?", answer: "The TEREA app helps you track your symptoms, medication, and appointments. Log in with your credentials, complete the symptom assessment, and follow your doctor's instructions.", category: "App Usage" },
];

export default function FAQsManagement() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "" });

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingFaq(null);
    setForm({ question: "", answer: "", category: "" });
    setDialogOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.question || !form.answer || !form.category) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (editingFaq) {
      setFaqs(faqs.map((f) => (f.id === editingFaq.id ? { ...f, ...form } : f)));
      toast({ title: "FAQ updated", description: "The FAQ has been updated successfully." });
    } else {
      setFaqs([...faqs, { id: String(Date.now()), ...form }]);
      toast({ title: "FAQ added", description: "New FAQ has been added successfully." });
    }
    setDialogOpen(false);
  };

  const handleDelete = (faq: FAQ) => {
    setFaqs(faqs.filter((f) => f.id !== faq.id));
    toast({ title: "FAQ deleted", description: `"${faq.question}" has been removed.` });
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">FAQs Management</h1>
            <p className="text-muted-foreground">Manage frequently asked questions for all users</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All FAQs</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search FAQs..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span>{faq.question}</span>
                        <span className="text-xs text-muted-foreground">({faq.category})</span>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 pr-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(faq)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-status-danger" onClick={() => handleDelete(faq)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., General, Symptoms" />
            </div>
            <div className="space-y-2">
              <Label>Question</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter the question" />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Enter the answer" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingFaq ? "Save Changes" : "Add FAQ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
