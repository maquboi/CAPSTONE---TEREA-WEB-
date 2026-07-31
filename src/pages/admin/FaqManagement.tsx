import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, Edit2, Trash2, Loader2, HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FaqManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ question: "", answer: "", category: "General" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingId(faq.id);
      setFormData({ question: faq.question, answer: faq.answer, category: faq.category });
    } else {
      setEditingId(null);
      setFormData({ question: "", answer: "", category: "General" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ question: "", answer: "", category: "General" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingId) {
        // Update existing FAQ
        const { error } = await supabase
          .from('faqs')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // Insert new FAQ
        const { error } = await supabase
          .from('faqs')
          .insert([formData]);
        if (error) throw error;
      }
      await fetchFaqs();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Failed to save FAQ. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this DOH Guideline? It will be removed from the patient mobile app immediately.")) return;
    
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      // Remove from UI without needing to refetch
      setFaqs(faqs.filter(faq => faq.id !== id));
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("Failed to delete FAQ.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#606C38]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin">
      <div className="space-y-6 animate-fade-in font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-[#606C38]" />
              FAQ & Guidelines Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage the DOH Guidelines and clinic rules visible on the patient mobile app.
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#606C38] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#283618] transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Guideline
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Question / Topic</th>
                  <th className="px-6 py-4">Answer / Content</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {faqs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No guidelines found. Click "Add Guideline" to create one.
                    </td>
                  </tr>
                ) : (
                  faqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DDE5B6]/50 text-[#606C38]">
                          {faq.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top font-medium text-slate-900 max-w-xs">{faq.question}</td>
                      <td className="px-6 py-4 align-top max-w-md line-clamp-3">{faq.answer}</td>
                      <td className="px-6 py-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(faq)}
                            className="p-2 text-slate-400 hover:text-[#606C38] hover:bg-[#606C38]/10 rounded-lg transition-colors"
                            title="Edit FAQ"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(faq.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete FAQ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Guideline" : "Add New Guideline"}
                </h2>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input 
                    required
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full rounded-xl border-slate-200 border p-3 text-sm focus:border-[#606C38] focus:ring-[#606C38] outline-none"
                    placeholder="e.g. Diet & Lifestyle, Medication"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Question / Topic</label>
                  <input 
                    required
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                    className="w-full rounded-xl border-slate-200 border p-3 text-sm focus:border-[#606C38] focus:ring-[#606C38] outline-none"
                    placeholder="Enter the question..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Answer / Content</label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    className="w-full rounded-xl border-slate-200 border p-3 text-sm focus:border-[#606C38] focus:ring-[#606C38] outline-none resize-none"
                    placeholder="Provide the medically validated answer..."
                  />
                </div>
                
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 text-sm font-medium text-white bg-[#606C38] hover:bg-[#283618] rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingId ? "Save Changes" : "Add Guideline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}