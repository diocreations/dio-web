import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, HelpCircle, FolderOpen, Save, RotateCcw, Link as LinkIcon,
  GripVertical, Eye, EyeOff
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminFAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "general",
    link_url: "",
    link_text: "",
    order: 0,
    is_active: true
  });
  
  const [categoryForm, setCategoryForm] = useState({
    category_id: "",
    name: "",
    slug: "",
    description: "",
    page_type: "both",
    order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [faqRes, catRes] = await Promise.all([
        fetch(`${API_URL}/api/faq/admin/all`),
        fetch(`${API_URL}/api/faq/admin/categories`)
      ]);
      const faqData = await faqRes.json();
      const catData = await catRes.json();
      setFaqs(faqData);
      setCategories(catData);
    } catch (error) {
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFaq = async () => {
    try {
      const url = editingFaq 
        ? `${API_URL}/api/faq/admin/faq/${editingFaq.faq_id}`
        : `${API_URL}/api/faq/admin/faq`;
      const method = editingFaq ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faqForm)
      });
      
      if (res.ok) {
        toast.success(editingFaq ? "FAQ updated!" : "FAQ created!");
        setShowFaqDialog(false);
        resetFaqForm();
        fetchData();
      } else {
        toast.error("Failed to save FAQ");
      }
    } catch (error) {
      toast.error("Error saving FAQ");
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`${API_URL}/api/faq/admin/faq/${faqId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("FAQ deleted");
        fetchData();
      }
    } catch {
      toast.error("Failed to delete FAQ");
    }
  };

  const handleSaveCategory = async () => {
    try {
      const url = editingCategory 
        ? `${API_URL}/api/faq/admin/category/${editingCategory.category_id}`
        : `${API_URL}/api/faq/admin/category`;
      const method = editingCategory ? "PUT" : "POST";
      
      // Generate slug if not provided
      const formData = {
        ...categoryForm,
        category_id: categoryForm.category_id || `cat_${Date.now()}`,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-')
      };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(editingCategory ? "Category updated!" : "Category created!");
        setShowCategoryDialog(false);
        resetCategoryForm();
        fetchData();
      }
    } catch {
      toast.error("Error saving category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Delete this category? FAQs in this category will remain but may not display.")) return;
    try {
      await fetch(`${API_URL}/api/faq/admin/category/${categoryId}`, { method: "DELETE" });
      toast.success("Category deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("This will reset all FAQs to default values. Continue?")) return;
    try {
      await fetch(`${API_URL}/api/faq/admin/reset-defaults`, { method: "POST" });
      toast.success("FAQs reset to defaults");
      fetchData();
    } catch {
      toast.error("Failed to reset");
    }
  };

  const resetFaqForm = () => {
    setFaqForm({
      question: "", answer: "", category: "general", link_url: "", link_text: "", order: 0, is_active: true
    });
    setEditingFaq(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_id: "", name: "", slug: "", description: "", page_type: "both", order: 0, is_active: true
    });
    setEditingCategory(null);
  };

  const openEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      link_url: faq.link_url || "",
      link_text: faq.link_text || "",
      order: faq.order || 0,
      is_active: faq.is_active !== false
    });
    setShowFaqDialog(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      category_id: cat.category_id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      page_type: cat.page_type || "both",
      order: cat.order || 0,
      is_active: cat.is_active !== false
    });
    setShowCategoryDialog(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  // Group FAQs by category
  const faqsByCategory = {};
  faqs.forEach(faq => {
    if (!faqsByCategory[faq.category]) faqsByCategory[faq.category] = [];
    faqsByCategory[faq.category].push(faq);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FAQ Management</h1>
          <p className="text-muted-foreground">Manage FAQs shown on Products and Services pages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetDefaults}>
            <RotateCcw size={16} className="mr-2" /> Reset Defaults
          </Button>
        </div>
      </div>

      <Tabs defaultValue="faqs">
        <TabsList>
          <TabsTrigger value="faqs" className="gap-2"><HelpCircle size={16} /> FAQs ({faqs.length})</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><FolderOpen size={16} /> Categories ({categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetFaqForm(); setShowFaqDialog(true); }}>
              <Plus size={16} className="mr-2" /> Add FAQ
            </Button>
          </div>

          {categories.map(cat => {
            const catFaqs = faqsByCategory[cat.slug] || [];
            return (
              <Card key={cat.slug}>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderOpen size={18} className="text-primary" />
                    {cat.name}
                    <span className="text-sm font-normal text-muted-foreground">({catFaqs.length} FAQs)</span>
                    <span className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded">{cat.page_type}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catFaqs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No FAQs in this category</p>
                  ) : (
                    catFaqs.map(faq => (
                      <div key={faq.faq_id} className={`flex items-start gap-3 p-3 rounded-lg border ${faq.is_active ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                        <GripVertical size={16} className="text-slate-300 mt-1 cursor-move" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{faq.question}</p>
                            {!faq.is_active && <EyeOff size={14} className="text-muted-foreground" />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{faq.answer}</p>
                          {faq.link_url && (
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              <LinkIcon size={12} /> {faq.link_text || faq.link_url}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditFaq(faq)}>
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFaq(faq.faq_id)}>
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetCategoryForm(); setShowCategoryDialog(true); }}>
              <Plus size={16} className="mr-2" /> Add Category
            </Button>
          </div>

          <div className="grid gap-4">
            {categories.map(cat => (
              <Card key={cat.category_id} className={cat.is_active ? '' : 'opacity-60'}>
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical size={16} className="text-slate-300 cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{cat.name}</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{cat.page_type}</span>
                      {!cat.is_active && <EyeOff size={14} className="text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{cat.description || cat.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.category_id)}>
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAQ Dialog */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question *</Label>
              <Input value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} placeholder="Enter the question" />
            </div>
            <div>
              <Label>Answer *</Label>
              <Textarea value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} placeholder="Enter the answer" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={faqForm.category} onValueChange={v => setFaqForm({...faqForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order</Label>
                <Input type="number" value={faqForm.order} onChange={e => setFaqForm({...faqForm, order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div>
              <Label>Link URL (optional)</Label>
              <Input value={faqForm.link_url} onChange={e => setFaqForm({...faqForm, link_url: e.target.value})} placeholder="/services/web-development" />
            </div>
            <div>
              <Label>Link Text</Label>
              <Input value={faqForm.link_text} onChange={e => setFaqForm({...faqForm, link_text: e.target.value})} placeholder="Learn More" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={faqForm.is_active} onCheckedChange={v => setFaqForm({...faqForm, is_active: v})} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSaveFaq} className="w-full">
              <Save size={16} className="mr-2" /> {editingFaq ? "Update" : "Create"} FAQ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="Web Development" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} placeholder="web-development (auto-generated)" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="Questions about web development" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Show On</Label>
                <Select value={categoryForm.page_type} onValueChange={v => setCategoryForm({...categoryForm, page_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Pages</SelectItem>
                    <SelectItem value="products">Products Only</SelectItem>
                    <SelectItem value="services">Services Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order</Label>
                <Input type="number" value={categoryForm.order} onChange={e => setCategoryForm({...categoryForm, order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={categoryForm.is_active} onCheckedChange={v => setCategoryForm({...categoryForm, is_active: v})} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSaveCategory} className="w-full">
              <Save size={16} className="mr-2" /> {editingCategory ? "Update" : "Create"} Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQ;
