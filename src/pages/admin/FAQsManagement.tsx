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

const faqs = [
  {
    id: "1",
    question: "What is tuberculosis (TB)?",
    answer: "Tuberculosis is an infectious disease caused by bacteria that mainly affects the lungs. It spreads through the air when infected people cough or sneeze.",
    category: "General",
  },
  {
    id: "2",
    question: "What are the common symptoms of TB?",
    answer: "Common symptoms include persistent cough (more than 2 weeks), fever, night sweats, weight loss, fatigue, and coughing up blood.",
    category: "Symptoms",
  },
  {
    id: "3",
    question: "How is TB treated?",
    answer: "TB is treated with a combination of antibiotics taken for 6-9 months. It's crucial to complete the full course of treatment to prevent drug resistance.",
    category: "Treatment",
  },
  {
    id: "4",
    question: "Is TB contagious?",
    answer: "Yes, TB is contagious and spreads through airborne droplets. However, it typically requires prolonged close contact with an infected person.",
    category: "Prevention",
  },
  {
    id: "5",
    question: "How do I use the TEREA app?",
    answer: "The TEREA app helps you track your symptoms, medication, and appointments. Log in with your credentials, complete the symptom assessment, and follow your doctor's instructions.",
    category: "App Usage",
  },
];

export default function FAQsManagement() {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              FAQs Management
            </h1>
            <p className="text-muted-foreground">
              Manage frequently asked questions for all users
            </p>
          </div>
          <Button>
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
                <Input placeholder="Search FAQs..." className="pl-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <div className="flex items-center">
                    <AccordionTrigger className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span>{faq.question}</span>
                        <span className="text-xs text-muted-foreground">
                          ({faq.category})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 pr-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-status-danger">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
