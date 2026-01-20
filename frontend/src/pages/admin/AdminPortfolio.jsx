import AdminLayout from "../../components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, ExternalLink } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPortfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "", slug: "", category: "", description: "", image_url: "",
    gallery_images: "", client_name: "", technologies: "", project_url: "",
    is_featured: false, order: 0, is_active: true,
  });

  const fetchPortfolio = () => {
    fetch(`${API_URL}/api/portfolio`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setPortfolio(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchPortfolio(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev, [name]: value,
      ...(name === "title" && !editingItem ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const gallery_images = formData.gallery_images.split("\n").filter((f) => f.trim());
    const technologies = formData.technologies.split(",").map((t) => t.trim()).filter((t) => t);
    try {
      const body = { ...formData, gallery_images, technologies };
      const url = editingItem ? `${API_URL}/api/portfolio/${editingItem.portfolio_id}` : `${API_URL}/api/portfolio`;
      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (response.ok) {
        toast.success(editingItem ? "Portfolio item updated!" : "Portfolio item created!");
        setDialogOpen(false); resetForm(); fetchPortfolio();
      } else throw new Error("Failed");
    } catch { toast.error("Failed to save"); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title, slug: item.slug, category: item.category, description: item.description,
      image_url: item.image_url || "", gallery_images: item.gallery_images?.join("\n") || "",
      client_name: item.client_name || "", technologies: item.technologies?.join(", ") || "",
      project_url: item.project_url || "", is_featured: item.is_featured, order: item.order, is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await fetch(`${API_URL}/api/portfolio/${id}`, { method: "DELETE", credentials: "include" });
      toast.success("Deleted!"); fetchPortfolio();
    } catch { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: "", slug: "", category: "", description: "", image_url: "",
      gallery_images: "", client_name: "", technologies: "", project_url: "",
      is_featured: false, order: 0, is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Portfolio</h1>
            <p className="text-muted-foreground">Manage your portfolio items</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-portfolio-btn"><Plus className="mr-2" size={18} /> Add Item</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingItem ? "Edit Item" : "Add Portfolio Item"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="title">Title *</Label><Input id="title" name="title" value={formData.title} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label htmlFor="slug">Slug *</Label><Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="category">Category *</Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required placeholder="Web Design" /></div>
                  <div className="space-y-2"><Label htmlFor="client_name">Client Name</Label><Input id="client_name" name="client_name" value={formData.client_name} onChange={handleChange} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="description">Description *</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required /></div>
                <div className="space-y-2"><Label htmlFor="image_url">Featured Image URL *</Label><Input id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} required /></div>
                <div className="space-y-2"><Label htmlFor="gallery_images">Gallery Images (one URL per line)</Label><Textarea id="gallery_images" name="gallery_images" value={formData.gallery_images} onChange={handleChange} rows={3} /></div>
                <div className="space-y-2"><Label htmlFor="technologies">Technologies (comma separated)</Label><Input id="technologies" name="technologies" value={formData.technologies} onChange={handleChange} placeholder="React, Node.js, MongoDB" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="project_url">Project URL</Label><Input id="project_url" name="project_url" value={formData.project_url} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="order">Order</Label><Input id="order" name="order" type="number" value={formData.order} onChange={handleChange} /></div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_featured: c }))} /><Label htmlFor="is_featured">Featured</Label></div>
                  <div className="flex items-center gap-2"><Switch id="is_active" checked={formData.is_active} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_active: c }))} /><Label htmlFor="is_active">Active</Label></div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit">{editingItem ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-48 rounded-lg" />))}</div>)
          : portfolio.length === 0 ? (<Card><CardContent className="py-12 text-center text-muted-foreground">No portfolio items yet.</CardContent></Card>)
          : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map((item) => (
              <Card key={item.portfolio_id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video relative">
                  <img src={item.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"} alt={item.title} className="w-full h-full object-cover" />
                  {item.is_featured && (<span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded bg-primary text-white text-xs"><Star size={12} />Featured</span>)}
                  {!item.is_active && (<span className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800/80 text-white text-xs">Inactive</span>)}
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-primary font-medium">{item.category}</p>
                  <h3 className="font-medium text-foreground mt-1">{item.title}</h3>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Pencil size={14} className="mr-1" />Edit</Button>
                    {item.project_url && (<Button variant="ghost" size="sm" asChild><a href={item.project_url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} className="mr-1" />View</a></Button>)}
                    <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={() => handleDelete(item.portfolio_id)}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>)}
      </div>
    </AdminLayout>
  );
};

export default AdminPortfolio;
