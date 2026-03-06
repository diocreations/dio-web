import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Edit, Eye, ExternalLink, FileText, Globe } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminCustomPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPage, setNewPage] = useState({ title: "", slug: "" });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pages`, { credentials: "include" });
      const data = await res.json();
      setPages(data.filter(p => p.is_custom));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pages:", error);
      setLoading(false);
    }
  };

  const createPage = async () => {
    if (!newPage.title || !newPage.slug) {
      toast.error("Title and slug are required");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newPage.title,
          slug: newPage.slug.toLowerCase().replace(/\s+/g, "-"),
          is_published: false,
          content: {
            hero: { badge: "", title: newPage.title, highlight: "", description: "", cta_text: "", cta_link: "", image: "" },
            stats: [],
            features: [],
            features_title: "",
            features_subtitle: "",
            testimonials: [],
            benefits: [],
            benefits_title: "",
            cta: { title: "", description: "", button_text: "", button_link: "" }
          }
        })
      });
      
      if (res.ok) {
        toast.success("Page created!");
        setShowCreateDialog(false);
        setNewPage({ title: "", slug: "" });
        fetchPages();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create page");
      }
    } catch (error) {
      toast.error("Failed to create page");
    } finally {
      setSaving(false);
    }
  };

  const updatePage = async (slug, data) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pages/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success("Page saved!");
        fetchPages();
      } else {
        toast.error("Failed to save page");
      }
    } catch (error) {
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (slug) => {
    if (!window.confirm("Are you sure you want to delete this page?")) return;
    
    try {
      const res = await fetch(`${API_URL}/api/pages/${slug}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (res.ok) {
        toast.success("Page deleted!");
        setEditingPage(null);
        fetchPages();
      } else {
        toast.error("Failed to delete page");
      }
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  const updateEditingField = (section, field, value) => {
    setEditingPage(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: typeof field === 'string' 
          ? { ...(prev.content?.[section] || {}), [field]: value }
          : value
      }
    }));
  };

  const addItem = (section) => {
    const templates = {
      stats: { value: "", label: "" },
      features: { icon: "Sparkles", title: "", description: "" },
      testimonials: { name: "", role: "", text: "", rating: 5 },
      benefits: ""
    };
    
    setEditingPage(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: [...(prev.content?.[section] || []), templates[section]]
      }
    }));
  };

  const updateItem = (section, index, field, value) => {
    setEditingPage(prev => {
      const items = [...(prev.content?.[section] || [])];
      if (typeof items[index] === 'string') {
        items[index] = value;
      } else {
        items[index] = { ...items[index], [field]: value };
      }
      return {
        ...prev,
        content: { ...prev.content, [section]: items }
      };
    });
  };

  const removeItem = (section, index) => {
    setEditingPage(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [section]: (prev.content?.[section] || []).filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (editingPage) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Edit: {editingPage.title}</h1>
              <p className="text-muted-foreground">/{editingPage.slug}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
              <Button onClick={() => updatePage(editingPage.slug, editingPage)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Published</Label>
                <Switch
                  checked={editingPage.is_published}
                  onCheckedChange={(checked) => setEditingPage(prev => ({ ...prev, is_published: checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  {editingPage.is_published ? "Page is live" : "Page is hidden"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Hero Section</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input value={editingPage.content?.hero?.badge || ""} onChange={(e) => updateEditingField("hero", "badge", e.target.value)} placeholder="e.g., New Feature" />
                </div>
                <div className="space-y-2">
                  <Label>Hero Image URL</Label>
                  <Input value={editingPage.content?.hero?.image || ""} onChange={(e) => updateEditingField("hero", "image", e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editingPage.content?.hero?.title || ""} onChange={(e) => updateEditingField("hero", "title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Highlighted Text (gradient)</Label>
                  <Input value={editingPage.content?.hero?.highlight || ""} onChange={(e) => updateEditingField("hero", "highlight", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editingPage.content?.hero?.description || ""} onChange={(e) => updateEditingField("hero", "description", e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input value={editingPage.content?.hero?.cta_text || ""} onChange={(e) => updateEditingField("hero", "cta_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Link</Label>
                  <Input value={editingPage.content?.hero?.cta_link || ""} onChange={(e) => updateEditingField("hero", "cta_link", e.target.value)} placeholder="/contact" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Stats (Dark Bar)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(editingPage.content?.stats || []).map((stat, i) => (
                <div key={i} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input value={stat.value} onChange={(e) => updateItem("stats", i, "value", e.target.value)} placeholder="50K+" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={stat.label} onChange={(e) => updateItem("stats", i, "label", e.target.value)} placeholder="Users" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem("stats", i)}><Trash2 size={16} className="text-red-500" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("stats")}><Plus size={14} className="mr-1" /> Add Stat</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <Label className="text-xs">Section Title</Label>
                  <Input value={editingPage.content?.features_title || ""} onChange={(e) => setEditingPage(prev => ({ ...prev, content: { ...prev.content, features_title: e.target.value } }))} placeholder="Why Choose Us?" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Section Subtitle</Label>
                  <Input value={editingPage.content?.features_subtitle || ""} onChange={(e) => setEditingPage(prev => ({ ...prev, content: { ...prev.content, features_subtitle: e.target.value } }))} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(editingPage.content?.features || []).map((feature, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">Feature {i + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem("features", i)}><Trash2 size={14} className="text-red-500" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Icon</Label>
                      <Input value={feature.icon} onChange={(e) => updateItem("features", i, "icon", e.target.value)} placeholder="Sparkles" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input value={feature.title} onChange={(e) => updateItem("features", i, "title", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={feature.description} onChange={(e) => updateItem("features", i, "description", e.target.value)} rows={2} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("features")}><Plus size={14} className="mr-1" /> Add Feature</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Benefits (Checklist)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Section Title</Label>
                <Input value={editingPage.content?.benefits_title || ""} onChange={(e) => setEditingPage(prev => ({ ...prev, content: { ...prev.content, benefits_title: e.target.value } }))} />
              </div>
              {(editingPage.content?.benefits || []).map((benefit, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={benefit} onChange={(e) => updateItem("benefits", i, null, e.target.value)} placeholder="Benefit point" />
                  <Button variant="ghost" size="icon" onClick={() => removeItem("benefits", i)}><Trash2 size={16} className="text-red-500" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("benefits")}><Plus size={14} className="mr-1" /> Add Benefit</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Testimonials</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(editingPage.content?.testimonials || []).map((t, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">Testimonial {i + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem("testimonials", i)}><Trash2 size={14} className="text-red-500" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input value={t.name} onChange={(e) => updateItem("testimonials", i, "name", e.target.value)} placeholder="Name" />
                    <Input value={t.role} onChange={(e) => updateItem("testimonials", i, "role", e.target.value)} placeholder="Role" />
                    <Input type="number" min="1" max="5" value={t.rating} onChange={(e) => updateItem("testimonials", i, "rating", parseInt(e.target.value))} />
                  </div>
                  <Textarea value={t.text} onChange={(e) => updateItem("testimonials", i, "text", e.target.value)} rows={2} placeholder="Quote..." />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem("testimonials")}><Plus size={14} className="mr-1" /> Add Testimonial</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Bottom CTA</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingPage.content?.cta?.title || ""} onChange={(e) => updateEditingField("cta", "title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editingPage.content?.cta?.description || ""} onChange={(e) => updateEditingField("cta", "description", e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input value={editingPage.content?.cta?.button_text || ""} onChange={(e) => updateEditingField("cta", "button_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Button Link</Label>
                  <Input value={editingPage.content?.cta?.button_link || ""} onChange={(e) => updateEditingField("cta", "button_link", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={() => deletePage(editingPage.slug)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Page
            </Button>
            <Button onClick={() => updatePage(editingPage.slug, editingPage)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Page
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="admin-custom-pages-title">Custom Pages</h1>
            <p className="text-muted-foreground">Create and manage custom landing pages</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="create-page-btn">
                <Plus className="h-4 w-4 mr-2" /> New Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input value={newPage.title} onChange={(e) => setNewPage(prev => ({ ...prev, title: e.target.value }))} placeholder="My New Page" data-testid="new-page-title" />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/page/</span>
                    <Input value={newPage.slug} onChange={(e) => setNewPage(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} placeholder="my-new-page" data-testid="new-page-slug" />
                  </div>
                </div>
                <Button onClick={createPage} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Page
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {pages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No custom pages yet. Create your first page!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pages.map((page) => (
              <Card key={page.page_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">{page.title}</h3>
                      <p className="text-sm text-muted-foreground">/page/{page.slug}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${page.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {page.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {page.is_published && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={16} />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setEditingPage(page)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deletePage(page.slug)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomPages;
