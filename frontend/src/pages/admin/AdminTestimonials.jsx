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
import { Plus, Pencil, Trash2, Star } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    client_name: "", client_title: "", client_company: "", client_image: "",
    content: "", rating: 5, is_featured: false, order: 0, is_active: true,
  });

  const fetchTestimonials = () => {
    fetch(`${API_URL}/api/testimonials`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setTestimonials(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem ? `${API_URL}/api/testimonials/${editingItem.testimonial_id}` : `${API_URL}/api/testimonials`;
      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success(editingItem ? "Testimonial updated!" : "Testimonial created!");
        setDialogOpen(false); resetForm(); fetchTestimonials();
      } else throw new Error("Failed");
    } catch { toast.error("Failed to save"); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      client_name: item.client_name, client_title: item.client_title, client_company: item.client_company,
      client_image: item.client_image || "", content: item.content, rating: item.rating,
      is_featured: item.is_featured, order: item.order, is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try {
      await fetch(`${API_URL}/api/testimonials/${id}`, { method: "DELETE", credentials: "include" });
      toast.success("Deleted!"); fetchTestimonials();
    } catch { toast.error("Failed to delete"); }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      client_name: "", client_title: "", client_company: "", client_image: "",
      content: "", rating: 5, is_featured: false, order: 0, is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Testimonials</h1>
            <p className="text-muted-foreground">Manage client testimonials</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-testimonial-btn"><Plus className="mr-2" size={18} /> Add Testimonial</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingItem ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="client_name">Client Name *</Label><Input id="client_name" name="client_name" value={formData.client_name} onChange={handleChange} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="client_title">Title *</Label><Input id="client_title" name="client_title" value={formData.client_title} onChange={handleChange} required placeholder="CEO" /></div>
                  <div className="space-y-2"><Label htmlFor="client_company">Company *</Label><Input id="client_company" name="client_company" value={formData.client_company} onChange={handleChange} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="content">Testimonial Content *</Label><Textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={4} required /></div>
                <div className="space-y-2"><Label htmlFor="client_image">Client Photo URL</Label><Input id="client_image" name="client_image" value={formData.client_image} onChange={handleChange} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="rating">Rating (1-5)</Label><Input id="rating" name="rating" type="number" min="1" max="5" value={formData.rating} onChange={handleChange} /></div>
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

        {loading ? (<div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg" />))}</div>)
          : testimonials.length === 0 ? (<Card><CardContent className="py-12 text-center text-muted-foreground">No testimonials yet.</CardContent></Card>)
          : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((item) => (
              <Card key={item.testimonial_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">{[...Array(item.rating)].map((_, i) => (<Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />))}</div>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">"{item.content}"</p>
                  <div className="flex items-center gap-3">
                    {item.client_image ? (<img src={item.client_image} alt={item.client_name} className="w-10 h-10 rounded-full object-cover" />)
                      : (<div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center"><span className="text-primary font-medium">{item.client_name.charAt(0)}</span></div>)}
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{item.client_name}</p>
                      <p className="text-xs text-muted-foreground">{item.client_title}, {item.client_company}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.testimonial_id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                  {item.is_featured && (<span className="inline-block mt-3 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">Featured</span>)}
                </CardContent>
              </Card>
            ))}
          </div>)}
      </div>
    </AdminLayout>
  );
};

export default AdminTestimonials;
